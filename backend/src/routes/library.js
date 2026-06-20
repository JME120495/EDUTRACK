const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all books
router.get('/', auth, async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        loans: {
          where: { status: 'ACTIVE' },
          include: { eleve: { select: { name: true, class: { select: { name: true } } } } }
        }
      }
    });
    res.json(books);
  } catch (err) {
    console.error('[Library] Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a book (Director or Censeur)
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { title, author, isbn, quantity } = req.body;
  try {
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const book = await prisma.book.create({
      data: {
        schoolId: req.user.schoolId,
        title,
        author,
        isbn,
        quantity: parseInt(quantity) || 1
      }
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a loan
router.post('/:bookId/loans', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { bookId } = req.params;
  const { eleveId, dateRetour } = req.body;
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId }, include: { loans: { where: { status: 'ACTIVE' } } } });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    if (book.loans.length >= book.quantity) {
      return res.status(400).json({ message: 'No available copies' });
    }

    const loan = await prisma.bookLoan.create({
      data: {
        bookId,
        eleveId,
        dateRetour: dateRetour ? new Date(dateRetour) : null
      },
      include: { eleve: true }
    });
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return a book (Director or Censeur)
router.patch('/loans/:id/return', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  try {
    const loan = await prisma.bookLoan.update({
      where: { id },
      data: { status: 'RETURNED' }
    });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

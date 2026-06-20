import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { Book, Plus, BookOpen, Clock, CheckCircle, Search, User, X } from 'lucide-react';

export default function LibraryPage() {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Add Book Form
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Loan Form
  const [students, setStudents] = useState([]);
  const [selectedEleveId, setSelectedEleveId] = useState('');
  const [dateRetour, setDateRetour] = useState('');

  useEffect(() => {
    loadBooks();
    loadStudents();
  }, []);

  async function loadBooks() {
    setLoading(true);
    try {
      const data = await apiFetch('/library');
      setBooks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    try {
      // Fetch all students (you might want to filter by active or limit in a real large DB)
      const data = await apiFetch('/eleves');
      setStudents(data);
    } catch (e) {
      console.error(e);
    }
  }

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/library', {
        method: 'POST',
        body: { title, author, isbn, quantity }
      });
      setAddBookModalOpen(false);
      setTitle(''); setAuthor(''); setIsbn(''); setQuantity('1');
      loadBooks();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      await apiFetch(`/library/${selectedBook.id}/loans`, {
        method: 'POST',
        body: { eleveId: selectedEleveId, dateRetour }
      });
      setLoanModalOpen(false);
      setSelectedEleveId('');
      setDateRetour('');
      loadBooks();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReturnBook = async (loanId) => {
    if (!window.confirm("Confirmer le retour de ce livre ?")) return;
    try {
      await apiFetch(`/library/loans/${loanId}/return`, {
        method: 'PATCH'
      });
      loadBooks();
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('library.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            {t('library.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setAddBookModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          {t('library.addBtn')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('library.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-slate-400">Chargement des livres...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-400">{t('library.empty')}</div>
        ) : (
          filteredBooks.map(book => {
            const availableCount = book.quantity - (book.loans?.length || 0);
            return (
              <div key={book.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${availableCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {availableCount} / {book.quantity} Dispo
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-slate-500 font-semibold mt-1">{book.author || 'Auteur inconnu'}</p>
                    <p className="text-xs text-slate-400 mt-1">ISBN: {book.isbn || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emprunts en cours</h4>
                  {book.loans?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucun emprunt.</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {book.loans?.map(loan => (
                        <div key={loan.id} className="bg-slate-50 rounded-lg p-2 flex justify-between items-center text-xs border border-slate-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{loan.eleve?.name}</span>
                          </div>
                          <button
                            onClick={() => handleReturnBook(loan.id)}
                            className="bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors font-bold shrink-0"
                            title="Marquer comme rendu"
                          >
                            Rendu
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedBook(book);
                      setLoanModalOpen(true);
                    }}
                    disabled={availableCount <= 0}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4" />
                    Prêter ce livre
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Book Modal */}
      {addBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-[#1E3A5F]">Ajouter au catalogue</h3>
              <button onClick={() => setAddBookModalOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleAddBook} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Titre du livre</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Auteur</label>
                <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ISBN</label>
                  <input type="text" value={isbn} onChange={e => setIsbn(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantité Totale</label>
                  <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-[#1E3A5F] text-[#F5A623] font-bold py-2.5 rounded-xl">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Book Modal */}
      {loanModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-[#1E3A5F]">Prêter : {selectedBook.title}</h3>
              <button onClick={() => setLoanModalOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreateLoan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Élève Emprunteur</label>
                <select required value={selectedEleveId} onChange={e => setSelectedEleveId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white">
                  <option value="">Sélectionnez un élève...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class?.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date limite de retour</label>
                <input type="date" required value={dateRetour} onChange={e => setDateRetour(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl">Confirmer le prêt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

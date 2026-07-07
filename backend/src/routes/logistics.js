const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

router.use(auth);
router.use(requireRole(['DIRECTOR', 'INTENDANT', 'SUPER_ADMIN']));

// --- TRANSPORT ROUTES ---
router.get('/transport/routes', async (req, res) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: { schoolId: req.user.schoolId },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des lignes de transport" });
  }
});

router.post('/transport/routes', async (req, res) => {
  try {
    const { name, busNumber, driverName, driverPhone, fee } = req.body;
    const route = await prisma.transportRoute.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        busNumber,
        driverName,
        driverPhone,
        fee: parseFloat(fee) || 0
      }
    });
    res.status(201).json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création de la ligne de transport" });
  }
});

router.put('/transport/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, busNumber, driverName, driverPhone, fee } = req.body;
    const route = await prisma.transportRoute.update({
      where: { id },
      data: {
        name,
        busNumber,
        driverName,
        driverPhone,
        fee: parseFloat(fee) || 0
      }
    });
    res.json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la modification de la ligne de transport" });
  }
});

router.delete('/transport/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transportRoute.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la suppression de la ligne de transport" });
  }
});

// --- TRANSPORT SUBSCRIPTIONS ---
router.get('/transport/subscriptions', async (req, res) => {
  try {
    const subs = await prisma.transportSubscription.findMany({
      where: { eleve: { schoolId: req.user.schoolId } },
      include: {
        eleve: {
          select: { id: true, name: true, matricule: true, class: { select: { name: true } } }
        },
        route: true
      }
    });
    res.json(subs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des abonnements transport" });
  }
});

router.post('/transport/subscriptions', async (req, res) => {
  try {
    const { eleveId, routeId, type, pickupPoint } = req.body;
    
    // Check if already subscribed
    const existing = await prisma.transportSubscription.findFirst({
      where: { eleveId }
    });
    
    if (existing) {
      return res.status(400).json({ error: "Cet élève a déjà un abonnement de transport." });
    }

    const sub = await prisma.transportSubscription.create({
      data: {
        eleveId,
        routeId,
        type: type || 'BOTH',
        pickupPoint
      },
      include: {
        eleve: {
          select: { id: true, name: true, matricule: true, class: { select: { name: true } } }
        },
        route: true
      }
    });
    res.status(201).json(sub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'abonnement au transport" });
  }
});

router.put('/transport/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { routeId, type, pickupPoint, status } = req.body;
    const sub = await prisma.transportSubscription.update({
      where: { id },
      data: { routeId, type, pickupPoint, status },
      include: {
        eleve: {
          select: { id: true, name: true, matricule: true, class: { select: { name: true } } }
        },
        route: true
      }
    });
    res.json(sub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la modification de l'abonnement" });
  }
});

router.delete('/transport/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transportSubscription.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'abonnement" });
  }
});


// --- CANTEEN SUBSCRIPTIONS ---
router.get('/canteen/subscriptions', async (req, res) => {
  try {
    const subs = await prisma.canteenSubscription.findMany({
      where: { eleve: { schoolId: req.user.schoolId } },
      include: {
        eleve: {
          select: { id: true, name: true, matricule: true, class: { select: { name: true } } }
        }
      }
    });
    res.json(subs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des abonnements cantine" });
  }
});

router.post('/canteen/subscriptions', async (req, res) => {
  try {
    const { eleveId, dietaryNotes } = req.body;
    
    // Check if already subscribed
    const existing = await prisma.canteenSubscription.findFirst({
      where: { eleveId }
    });
    
    if (existing) {
      return res.status(400).json({ error: "Cet élève est déjà inscrit à la cantine." });
    }

    const sub = await prisma.canteenSubscription.create({
      data: {
        eleveId,
        dietaryNotes
      },
      include: {
        eleve: {
          select: { id: true, name: true, matricule: true, class: { select: { name: true } } }
        }
      }
    });
    res.status(201).json(sub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'inscription à la cantine" });
  }
});

router.put('/canteen/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dietaryNotes, status } = req.body;
    const sub = await prisma.canteenSubscription.update({
      where: { id },
      data: { dietaryNotes, status },
      include: {
        eleve: {
          select: { id: true, name: true, matricule: true, class: { select: { name: true } } }
        }
      }
    });
    res.json(sub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la modification de l'abonnement" });
  }
});

router.delete('/canteen/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.canteenSubscription.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'abonnement" });
  }
});

module.exports = router;

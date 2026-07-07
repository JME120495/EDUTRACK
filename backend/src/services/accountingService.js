const prisma = require('../db');

/**
 * Automatically generate a double-entry accounting record for a tuition payment
 */
const generateEntryForPayment = async (schoolId, payment) => {
  try {
    // Check if accounting is initialized for this school
    const activeFy = await prisma.accountingFiscalYear.findFirst({
      where: { schoolId, status: 'OPEN' }
    });
    if (!activeFy) return; // No active fiscal year, skip accounting

    // Get journal (CA for Cash, BQ for Bank/Mobile Money)
    const journalCode = payment.paymentMethod === 'CASH' ? 'CA' : 'BQ';
    const journal = await prisma.accountingJournal.findUnique({
      where: { schoolId_code: { schoolId, code: journalCode } }
    });
    if (!journal) return; // Journal doesn't exist

    // Get accounts (521 Caisse / 512 Banque / 571 Mobile Money)
    let debitAccountNum = '512';
    if (payment.paymentMethod === 'CASH') debitAccountNum = '521';
    else if (payment.paymentMethod === 'MOBILE_MONEY' || payment.paymentMethod === 'WAVE') debitAccountNum = '571';

    const debitAccount = await prisma.accountingAccount.findUnique({
      where: { schoolId_number: { schoolId, number: debitAccountNum } }
    });

    // 706 - Frais de Scolarité
    const creditAccount = await prisma.accountingAccount.findUnique({
      where: { schoolId_number: { schoolId, number: '706' } }
    });

    if (!debitAccount || !creditAccount) return; // Accounts not configured

    const student = await prisma.eleve.findUnique({ where: { id: payment.eleveId } });

    // Create entry
    await prisma.accountingEntry.create({
      data: {
        schoolId,
        journalId: journal.id,
        fiscalYearId: activeFy.id,
        date: new Date(),
        reference: payment.transactionReference,
        description: `Paiement Scolarité - ${student?.name || 'Élève'}`,
        status: 'VALIDATED',
        lines: {
          create: [
            {
              accountId: debitAccount.id,
              debit: payment.amount,
              credit: 0,
              description: `Encaissement ${payment.paymentMethod}`
            },
            {
              accountId: creditAccount.id,
              debit: 0,
              credit: payment.amount,
              description: `Revenu Scolarité`
            }
          ]
        }
      }
    });

    console.log(`[Accounting] Auto-generated entry for payment ${payment.transactionReference}`);
  } catch (error) {
    console.error('[Accounting] Error generating entry for payment:', error);
  }
};

module.exports = {
  generateEntryForPayment
};

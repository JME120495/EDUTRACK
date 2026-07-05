const fs = require('fs');
const content = `
model ParentalConsent {
  id          String   @id @default(uuid())
  parentId    String
  parent      User     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  eleveId     String
  eleve       Eleve    @relation(fields: [eleveId], references: [id], onDelete: Cascade)
  consentType String   // "PEDAGOGICAL", "MARKETING", "PARTNERS", "HEALTH"
  status      String   // "GRANTED", "WITHDRAWN"
  ipAddress   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  logs        ParentalConsentLog[]

  @@unique([parentId, eleveId, consentType])
  @@index([eleveId])
}

model ParentalConsentLog {
  id          String   @id @default(uuid())
  consentId   String
  consent     ParentalConsent @relation(fields: [consentId], references: [id], onDelete: Cascade)
  status      String   // "GRANTED", "WITHDRAWN"
  ipAddress   String?
  timestamp   DateTime @default(now())

  @@index([consentId])
}

model SensitiveDataAccessLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  eleveId     String
  eleve       Eleve    @relation(fields: [eleveId], references: [id], onDelete: Cascade)
  accessReason String?
  timestamp   DateTime @default(now())

  @@index([userId])
  @@index([eleveId])
}
`;
fs.appendFileSync('C:/DEV/Edutrack/backend/prisma/schema.prisma', content);
console.log("Appended");

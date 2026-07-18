-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "trialUsed" BOOLEAN NOT NULL DEFAULT false,
    "trialStartedAt" DATETIME,
    "purchasedAt" DATETIME,
    "paymentReference" TEXT,
    "paymobOrderId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_subscriptions" ("id", "isPremium", "paymentReference", "purchasedAt", "trialStartedAt", "trialUsed", "updatedAt", "userId") SELECT "id", "isPremium", "paymentReference", "purchasedAt", "trialStartedAt", "trialUsed", "updatedAt", "userId" FROM "subscriptions";
DROP TABLE "subscriptions";
ALTER TABLE "new_subscriptions" RENAME TO "subscriptions";
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


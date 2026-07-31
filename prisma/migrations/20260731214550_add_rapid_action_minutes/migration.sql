-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "diagnosisDate" DATETIME NOT NULL,
    "diabetesType" TEXT NOT NULL,
    "units" TEXT NOT NULL,
    "treatmentMode" TEXT NOT NULL,
    "insulinDelivery" TEXT,
    "rapidInsulinType" TEXT,
    "rapidUnitsPerDay" REAL,
    "rapidActionMinutes" INTEGER NOT NULL DEFAULT 240,
    "basalInsulinType" TEXT,
    "basalUnitsPerDay" REAL,
    "pills" TEXT NOT NULL DEFAULT '[]',
    "carbRatio" REAL,
    "isf" REAL,
    "carbRatioOverridden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_profiles" ("age", "basalInsulinType", "basalUnitsPerDay", "carbRatio", "carbRatioOverridden", "createdAt", "diabetesType", "diagnosisDate", "gender", "id", "insulinDelivery", "isf", "name", "pills", "rapidInsulinType", "rapidUnitsPerDay", "treatmentMode", "units", "updatedAt", "userId") SELECT "age", "basalInsulinType", "basalUnitsPerDay", "carbRatio", "carbRatioOverridden", "createdAt", "diabetesType", "diagnosisDate", "gender", "id", "insulinDelivery", "isf", "name", "pills", "rapidInsulinType", "rapidUnitsPerDay", "treatmentMode", "units", "updatedAt", "userId" FROM "profiles";
DROP TABLE "profiles";
ALTER TABLE "new_profiles" RENAME TO "profiles";
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

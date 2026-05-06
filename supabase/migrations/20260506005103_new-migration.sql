-- PilotSistem ilk migration
-- User ve Business tabloları

CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

CREATE TABLE "Business" (
    "id"        TEXT         NOT NULL,
    "ad"        TEXT         NOT NULL,
    "sektor"    TEXT,
    "vergiNo"   TEXT,
    "adres"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id"         TEXT         NOT NULL,
    "email"      TEXT         NOT NULL,
    "password"   TEXT         NOT NULL,
    "ad"         TEXT         NOT NULL,
    "soyad"      TEXT,
    "telefon"    TEXT,
    "role"       "Role"       NOT NULL DEFAULT 'OWNER',
    "businessId" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

ALTER TABLE "User"
    ADD CONSTRAINT "User_businessId_fkey"
    FOREIGN KEY ("businessId")
    REFERENCES "Business"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

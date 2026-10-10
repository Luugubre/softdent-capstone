-- CreateEnum
CREATE TYPE "FonasaVoucherStatus" AS ENUM ('PENDIENTE', 'UTILIZADO', 'ANULADO');

-- CreateTable
CREATE TABLE "FonasaVoucher" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "status" "FonasaVoucherStatus" NOT NULL DEFAULT 'PENDIENTE',
    "amount" INTEGER NOT NULL,
    "copayment" INTEGER NOT NULL DEFAULT 0,
    "patientId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FonasaVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementMember" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementContract" (
    "id" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "installmentsCount" INTEGER NOT NULL,
    "agreementId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementInstallment" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "contractId" TEXT NOT NULL,

    CONSTRAINT "AgreementInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FonasaVoucher_folio_key" ON "FonasaVoucher"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_name_key" ON "Agreement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementMember_agreementId_patientId_key" ON "AgreementMember"("agreementId", "patientId");

-- AddForeignKey
ALTER TABLE "FonasaVoucher" ADD CONSTRAINT "FonasaVoucher_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FonasaVoucher" ADD CONSTRAINT "FonasaVoucher_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementMember" ADD CONSTRAINT "AgreementMember_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementMember" ADD CONSTRAINT "AgreementMember_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementContract" ADD CONSTRAINT "AgreementContract_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementContract" ADD CONSTRAINT "AgreementContract_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementInstallment" ADD CONSTRAINT "AgreementInstallment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgreementContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

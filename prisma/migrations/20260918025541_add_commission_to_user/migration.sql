-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commission" DOUBLE PRECISION NOT NULL DEFAULT 40.0;

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalPaid" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BORRADOR',
    "dentistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

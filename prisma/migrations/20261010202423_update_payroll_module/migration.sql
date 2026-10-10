/*
  Warnings:

  - You are about to drop the column `totalPaid` on the `Payroll` table. All the data in the column will be lost.
  - The `status` column on the `Payroll` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `clinicRate` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dentistRate` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payroll` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('BORRADOR', 'CALCULADA', 'APROBADA', 'PAGADA', 'ANULADA');

-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "payrollId" TEXT;

-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "totalPaid",
ADD COLUMN     "adjustmentAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bonusAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "clinicRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "dentistRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "totalClinic" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDentist" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalProduced" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PayrollStatus" NOT NULL DEFAULT 'BORRADOR';

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

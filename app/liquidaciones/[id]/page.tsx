import { getPayrollDetails } from "@/lib/actions"
import { PayrollDetailClient } from "@/components/PayrollDetailClient"

export default async function DetalleLiquidacionPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ month?: string, year?: string }> 
}) {
  const { id } = await params;
  const { month: qMonth, year: qYear } = await searchParams;

  // Si no vienen en la URL, usamos el mes y año actual
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const month = qMonth ? parseInt(qMonth) : currentMonth;
  const year = qYear ? parseInt(qYear) : currentYear;

  const detailsResult = await getPayrollDetails(id, month, year);

  if (!detailsResult.success) {
    return <div className="p-8 text-center text-red-500 font-bold">{detailsResult.error}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <PayrollDetailClient 
        initialData={detailsResult} 
        dentistId={id} 
        month={month} 
        year={year} 
      />
    </div>
  );
}
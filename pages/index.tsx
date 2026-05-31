// pages/index.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import { useLanguage } from "@/context/LanguageContext";
import useSWR from "swr";
import { User } from "@supabase/supabase-js";
import HomeStats from "@/components/HomeStats";

const fetchStatsAndRevenue = async () => {
  try {
    // Rentals revenue
    const { data: rentals, error: rentalsError } = await supabase
      .from("rentals")
      .select("total_cost, status");
    if (rentalsError) throw rentalsError;
    let rentalSum = 0;
    let activeRentalsCount = 0;
    if (rentals && Array.isArray(rentals)) {
      rentalSum = rentals.reduce(
        (sum, r) => sum + (Number(r.total_cost) || 0),
        0
      );
      activeRentalsCount = rentals.filter(
        (r) => r.status && r.status.toLowerCase() === "activo"
      ).length;
    }

    // Memberships revenue
    const { data: memberships, error: membershipsError } = await supabase
      .from("memberships")
      .select("cost");
    if (membershipsError) throw membershipsError;
    let membershipSum = 0;
    if (memberships && Array.isArray(memberships)) {
      membershipSum = memberships.reduce(
        (sum, m) => sum + (Number(m.cost) || 0),
        0
      );
    }

    // Sales revenue
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("amount, quantity, item");
    if (salesError) throw salesError;
    let salesSum = 0;
    let donationSum = 0;
    if (sales && Array.isArray(sales)) {
      sales.forEach((s) => {
        if (
          s.item &&
          (s.item.toLowerCase() === "donation" ||
            s.item.toLowerCase() === "donación")
        ) {
          donationSum += Number(s.amount) * (Number(s.quantity) || 1);
        } else {
          salesSum += Number(s.amount) * (Number(s.quantity) || 1);
        }
      });
    }

    // Costs
    const { data: costs, error: costsError } = await supabase
      .from("costs")
      .select("amount");
    if (costsError) throw costsError;
    let costsSum = 0;
    if (costs && Array.isArray(costs)) {
      costsSum = costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    }

    // Active rentals deposit and profit calculations
    const { data: activeRentals, error: activeRentalsError } = await supabase
      .from("rentals")
      .select("deposit, user_type, start_date, bikes(type)")
      .eq("status", "Activo");
    if (activeRentalsError) throw activeRentalsError;
    let activeDepositRefunds = 0;
    let activeRentalProfit = 0;
    if (activeRentals && Array.isArray(activeRentals)) {
      activeRentals.forEach((r) => {
        const deposit = Number(r.deposit || 0);
        const start = r.start_date ? new Date(r.start_date) : new Date();
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.max(
          1,
          Math.ceil((now.getTime() - start.getTime()) / msPerDay)
        );
        const periods = Math.max(1, Math.ceil(days / 90));
        const bikeType = Array.isArray(r.bikes)
          ? (r.bikes[0] as { type?: string } | undefined)?.type
          : (r.bikes as { type?: string } | undefined)?.type;
        const isChildRental =
          r.user_type === "child" ||
          bikeType?.toLowerCase() === "childrens";
        let totalCost = 0;
        if (r.user_type === "charity") {
          totalCost = 0;
        } else if (isChildRental) {
          totalCost = periods * 5;
        } else {
          totalCost = periods * 10;
        }
        const expectedRefund = Math.max(deposit - totalCost, 0);
        activeDepositRefunds += expectedRefund;
        activeRentalProfit += deposit - expectedRefund;
      });
    }

    // Available bikes counter
    const { data: bikes, error: bikesError } = await supabase
      .from("bikes")
      .select("status");
    if (bikesError) throw bikesError;
    let availableBikesCount = 0;
    if (bikes && Array.isArray(bikes)) {
      availableBikesCount = bikes.filter(
        (b) => b.status && b.status.toLowerCase() === "disponible"
      ).length;
    }

    return {
      rentalRevenue: rentalSum,
      membershipRevenue: membershipSum,
      salesRevenue: salesSum,
      donationRevenue: donationSum,
      costs: costsSum,
      activeDepositRefunds,
      activeRentalProfit,
      totalRevenue: rentalSum + membershipSum + salesSum + donationSum,
      netRevenue: rentalSum + membershipSum + salesSum + donationSum - costsSum,
      availableBikesCount,
      activeRentalsCount,
    };
  } catch (err) {
    console.error("Stats/Revenue fetch error:", err);
    return {
      rentalRevenue: 0,
      membershipRevenue: 0,
      salesRevenue: 0,
      donationRevenue: 0,
      costs: 0,
      activeDepositRefunds: 0,
      activeRentalProfit: 0,
      totalRevenue: 0,
      netRevenue: 0,
      availableBikesCount: 0,
      activeRentalsCount: 0,
    };
  }
};

export default function HomePage() {
  const { lang } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const { data, error, isLoading } = useSWR(
    user ? "/api/revenue" : null,
    fetchStatsAndRevenue
  );

  const labels = {
      revenue: lang === "en" ? "Gross Revenue" : "Ingresos brutos",
    rentals: lang === "en" ? "Completed Rentals" : "Alquileres completados",
    memberships: lang === "en" ? "Memberships" : "Membresías",
    sales: lang === "en" ? "Sales" : "Ventas",
    depositRefunds: lang === "en" ? "Deposit Refunds Owed" : "Depósitos a devolver",
    rentalProfit: lang === "en" ? "Active Rental Profit" : "Ganancia de alquileres activos",
    donations: lang === "en" ? "Donations" : "Donaciones",
    loading: lang === "en" ? "Loading..." : "Cargando...",
    euro: "€",
    info: lang === "en"
      ? "This dashboard shows gross revenue before costs. For net revenue, subtract costs from the total."
      : "Este panel muestra los ingresos brutos antes de costos. Para ingresos netos, reste los costos del total.",
    costs: lang === "en" ? "Costs" : "Costos",
    netRevenue: lang === "en" ? "Net Revenue" : "Ingresos netos",
    availableBikes: lang === "en" ? "Available Bikes" : "Bicicletas Disponibles",
    activeRentals: lang === "en" ? "Active Rentals" : "Alquileres Activos",
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow mt-8">
        {/* Only show counters and revenue if logged in */}
        {user && (
          <>
            {/* Enhanced Counters Section */}
            <HomeStats />
            {/* Revenue Section */}
            <h1 className="text-2xl font-bold mb-6">{labels.revenue}</h1>
            <p className="mb-4 text-gray-700">{labels.info}</p>
            {error && <div>Error loading revenue: {error.message}</div>}
            {isLoading && <div>{labels.loading}</div>}
            {!isLoading && !error && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.rentals}</span>
                  <span>{data?.rentalRevenue} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.memberships}</span>
                  <span>{data?.membershipRevenue} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.sales}</span>
                  <span>{data?.salesRevenue} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.donations}</span>
                  <span>{data?.donationRevenue} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.depositRefunds}</span>
                  <span>-{data?.activeDepositRefunds} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.rentalProfit}</span>
                  <span>{data?.activeRentalProfit} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{labels.costs}</span>
                  <span>-{data?.costs} {labels.euro}</span>
                </div>
                <div className="flex justify-between items-center pt-4 text-lg font-bold">
                  <span>{labels.netRevenue}</span>
                  <span>
                    {data?.netRevenue} {labels.euro}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{labels.revenue}</span>
                  <span>
                    {data?.totalRevenue} {labels.euro}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

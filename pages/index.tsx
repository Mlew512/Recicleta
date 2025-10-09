// pages/index.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import { useLanguage } from "@/context/LanguageContext";
import useSWR from "swr";

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
      totalRevenue: rentalSum + membershipSum + salesSum + donationSum,
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
      totalRevenue: 0,
      availableBikesCount: 0,
      activeRentalsCount: 0,
    };
  }
};

export default function HomePage() {
  const { lang } = useLanguage();
  const [user, setUser] = useState<null | Record<string, unknown>>(null);

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
    revenue: lang === "en" ? "Total Revenue" : "Ingresos Totales",
    rentals: lang === "en" ? "Rentals" : "Alquileres",
    memberships: lang === "en" ? "Memberships" : "Membresías",
    sales: lang === "en" ? "Sales" : "Ventas",
    donations: lang === "en" ? "Donations" : "Donaciones",
    loading: lang === "en" ? "Loading..." : "Cargando...",
    euro: "€",
    info: lang === "en"
      ? "Sales can include t-shirts, sweaters, bells, etc."
      : "Las ventas pueden incluir camisetas, suéteres, timbres, etc.",
    availableBikes: lang === "en" ? "Available Bikes" : "Bicicletas Disponibles",
    activeRentals: lang === "en" ? "Active Rentals" : "Alquileres Activos",
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow mt-8">
        {/* Only show counters and revenue if logged in */}
        {user && (
          <>
            {/* Counters Section */}
            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold">{labels.availableBikes}</span>
                <span>{data?.availableBikesCount ?? "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold">{labels.activeRentals}</span>
                <span>{data?.activeRentalsCount ?? "-"}</span>
              </div>
            </div>
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
                <div className="flex justify-between items-center pt-4 text-lg font-bold">
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

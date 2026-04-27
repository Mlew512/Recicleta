import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";
import BikeSelect from "./BikeSelect";

export default function HomeStats() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState({
    charityRentals: 0,
    availableGoodBikes: 0,
    totalBadBikes: 0,
    totalBikes: 0,
    activeMembers: 0,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      // Charity rentals
      const { count: charityRentals } = await supabase
        .from("rentals")
        .select("id", { count: "exact" })
        .eq("user_type", "charity");
      // Bikes available in good condition
      const { count: availableGoodBikes } = await supabase
        .from("bikes")
        .select("id", { count: "exact" })
        .eq("status", "Disponible")
        .eq("condition", "Good");
        // Bikes that need maintenance
      const {count: totalBadBikes} = await supabase
        .from("bikes")
        .select("id", { count: "exact" })
        .eq("condition", "Needs Maintenance");
      const {count: totalBikes} = await supabase
        .from("bikes")
        .select("id", { count: "exact" }); 
      // Active members
      // Only count members whose end_date is after today
      const today = new Date().toISOString().split("T")[0];
      const { count: activeMembers } = await supabase
        .from("memberships")
        .select("id", { count: "exact" })
        .gt("end_date", today);
      if (mounted) {
        setStats({
          charityRentals: charityRentals ?? 0,
          availableGoodBikes: availableGoodBikes ?? 0,
          totalBadBikes: totalBadBikes ?? 0,
          totalBikes: totalBikes ?? 0,
          activeMembers: activeMembers ?? 0,
          loading: false,
        });
      }
    }
    fetchStats();
    return () => { mounted = false; };
  }, []);

  const labels = {
    charity: lang === "en" ? "Free Bike Rentals" : "Préstamos gratuitos de bicicletas",
    bikes: lang === "en" ? "Bikes Available (Good)" : "Bicicletas Disponibles (Buen Estado)",
    badBikes: lang === "en" ? "Bikes Needing Maintenance" : "Bicicletas que Necesitan Mantenimiento",
    totalBikes: lang === "en" ? "registered bikes" : "Bicicletas registradas",
    members: lang === "en" ? "Active Members" : "Miembros Activos",
    loading: lang === "en" ? "Loading..." : "Cargando...",
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 bg-gray-100 rounded p-4 text-center">
        <div className="text-2xl font-bold text-green-700">
          {stats.loading ? labels.loading : stats.charityRentals} 
        </div>
        <div className="text-sm text-gray-700 mt-1">{labels.charity} </div>{lang === "en" ? "since 2026" : "desde 2026"}
      </div>
      <div className="flex-1 bg-gray-100 rounded p-4 text-center">
        <div className="text-2xl font-bold text-green-700">
          {stats.loading ? labels.loading : stats.availableGoodBikes}
        </div>
        <div className="text-sm text-gray-700 mt-1">{labels.bikes}</div>
      </div>
      <div className="flex-1 bg-gray-100 rounded p-4 text-center">
        <div className="text-2xl font-bold text-green-700">
          {stats.loading ? labels.loading : stats.totalBadBikes}
        </div>
        <div className="text-sm text-gray-700 mt-1">{labels.badBikes}</div>
      </div>  
      <div className="flex-1 bg-gray-100 rounded p-4 text-center">
        <div className="text-2xl font-bold text-green-700">
          {stats.loading ? labels.loading : stats.totalBikes} 
        </div>
        <div className="text-sm text-gray-700 mt-1">{labels.totalBikes}</div>
      </div>

      <div className="flex-1 bg-gray-100 rounded p-4 text-center">
        <div className="text-2xl font-bold text-green-700">
          {stats.loading ? labels.loading : stats.activeMembers}
        </div>
        <div className="text-sm text-gray-700 mt-1">{labels.members}</div>
      </div>
    </div>
  );
}

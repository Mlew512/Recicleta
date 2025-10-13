import React from "react";

export default function RentalPrices({ lang }: { lang: "en" | "es" }) {
  const prices = {
    en: {
      title: "Bike Rental Prices",
      adult: "Adult bikes: €10 per 3-month period, €50 deposit.",
      child: "Children's bikes: €5 per 3-month period, €30 deposit.",
      note: "If these affordable prices are still a barrier, please contact us. We are committed to finding solutions so everyone can enjoy cycling.",
    },
    es: {
      title: "Precios de Alquiler de Bicicletas",
      adult: "Bicicletas para adultos: 10€ por período de 3 meses, 50€ de depósito.",
      child: "Bicicletas para niños: 5€ por período de 3 meses, 30€ de depósito.",
      note: "Si estos precios accesibles siguen siendo una barrera, por favor contáctanos. Estamos comprometidos a encontrar soluciones para que todos puedan disfrutar del ciclismo.",
    },
  };

  const p = prices[lang];

  return (
    <div className="bg-white rounded shadow p-6 my-6 max-w-xl mx-auto text-center">
      <h2 className="text-xl font-bold mb-4">{p.title}</h2>
      <ul className="mb-4">
        <li className="mb-2">{p.adult}</li>
        <li>{p.child}</li>
      </ul>
      <p className="text-green-700 font-semibold">{p.note}</p>
    </div>
  );
}
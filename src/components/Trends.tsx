"use client";
import React, { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import useTrends from "@/hooks/useTrends";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Artist {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface TrendsProps {
  allowedArtists: Artist[];
  myProducts: Product[];
}

const Trends: React.FC<TrendsProps> = ({
  allowedArtists,
  myProducts,
}) => {
  const { chartData, fetchTrends, loading, error } = useTrends();
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<string>("last_week");
  const [chartType, setChartType] = useState<"bar" | "line">("bar"); // State for chart type

  const handleFilterSubmit = () => {
    fetchTrends({
      artistId: selectedArtist || undefined,
      productId: selectedProduct || undefined,
      timeRange,
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Trends</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Artist:
            </label>
            <select
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
              value={selectedArtist || ""}
              onChange={(e) =>
                setSelectedArtist(Number(e.target.value) || null)
              }
            >
              <option value="">All Artists</option>
              {allowedArtists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Product:
            </label>
            <select
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
              value={selectedProduct || ""}
              onChange={(e) =>
                setSelectedProduct(Number(e.target.value) || null)
              }
            >
              <option value="">All Products</option>
              {myProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Time Range:
            </label>
            <select
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="">Select Time Range</option>
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Chart Type:
            </label>
            <select
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as "bar" | "line")}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
          onClick={handleFilterSubmit}
          disabled={loading}
        >
          {loading ? "Loading..." : "Apply Filters"}
        </button>
      </header>
      <main className="bg-white p-6 rounded-lg shadow-lg">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {chartData ? (
          <div className="w-full overflow-x-auto">
            {chartType === "bar" ? (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                }}
              />
            ) : (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                }}
              />
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            {loading
              ? "Loading data..."
              : "No data available. Adjust filters and try again."}
          </p>
        )}
      </main>
    </div>
  );
};

export default Trends;

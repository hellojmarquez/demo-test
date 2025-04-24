import { useState } from "react";
import { UserServices } from "@/services/UserServices";

interface Artist {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface TrendsFilter {
  artistId?: number;
  productId?: number;
  timeRange: string;
}

const calculateDateRange = (range: string) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = now;

  switch (range) {
    case "last_week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "last_month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "last_year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return { startDate: "", endDate: "" };
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

const useTrends = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (filters: TrendsFilter) => {
    const { timeRange, artistId, productId } = filters;
    const { startDate, endDate } = calculateDateRange(timeRange);

    if (!startDate || !endDate) {
      setError("Invalid date range.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const trends = await UserServices.getTrends(
        "dsp",
        "stream",
        startDate,
        endDate,
        {
          product_id: productId,
          artist_id: artistId,
        }
      );

      const labels = Array.from(
        { length: trends.data[0].totals.length },
        (_, i) => `Day ${i + 1}`
      );
      const datasets = trends.data.map((dsp: any) => ({
        label: dsp.name,
        data: dsp.totals,
        backgroundColor: `rgba(${Math.random() * 255}, ${
          Math.random() * 255
        }, ${Math.random() * 255}, 0.6)`,
      }));

      setChartData({ labels, datasets });
    } catch (err) {
      setError("Error fetching trends.");
    } finally {
      setLoading(false);
    }
  };

  return {
    chartData,
    fetchTrends,
    loading,
    error,
  };
};

export default useTrends;

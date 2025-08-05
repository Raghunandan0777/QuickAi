import React, { useEffect, useState } from "react";
import { dummyCreationData } from "../assets/assets";
import { Gem, Sparkle } from "lucide-react";
import { Protect } from "@clerk/clerk-react";
import CreationItem from "../components/CreationItem";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

function Dashboard() {
  const [creation, setCreation] = useState([]);
  const [sidebar, setSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const getDashboardData = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/user/get-user-creations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setCreation(data.creations);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getDashboardData();
  }, []);
  return (
    <div className="h-full overflow-y-scroll p-6">
      <div className="flex justify-start flex-wrap">
        {/* Total creation */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Total Creations</p>
            <h2 className="text-xl font-semibold">{creation.length}</h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center">
            <Sparkle className="w-5 text-white" />
          </div>
        </div>

        {/* Active Plans Card */}

        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Active Plan</p>
            <h2 className="text-xl font-semibold">
              <Protect plan="premium" fallback="Free">
                Premium
              </Protect>
            </h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center">
            <Gem className="w-5 text-white" />
          </div>
        </div>

        {isLoading ? (
          <div className="w-full flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-11 w-11 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="mt-6 mb-4">Recent Creations</p>
            {creation.map((item) => (
              <CreationItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

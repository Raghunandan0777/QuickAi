import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
// import { dummyPublishedCreationData } from '../assets/assets'
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

function Community() {
  const [creations, setCreations] = useState([]);
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const fetchCreations = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/user/get-published-creations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      console.log("Fetched creations:", data);
      if (data.success) {
        setCreations(data.creations || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  const imageLikeToggle = async (id) => {
    try {
      const { data } = await axios.post(
        "/api/user/toggle-like-creation",
        { id: String(id) },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
      
        const updatedCreations = creations.map(creation => {
          if (creation.id === id) {
            const currentLikes = Array.isArray(creation.likes) ? creation.likes : [];
            const userIdStr = user?.id?.toString() || '';
            
        
            if (typeof userIdStr !== 'string') {
              console.error('Invalid user ID format:', userIdStr);
              throw new Error('Invalid user ID format');
            }
            
            return {
              ...creation,
              likes: currentLikes.includes(userIdStr) 
                ? currentLikes.filter(like => like !== userIdStr)
                : [...currentLikes, userIdStr]
            };
          }
          return creation;
        });
        setCreations(updatedCreations);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
       console.error('Like toggle error:', error);
      
       const errorMessage = error?.response?.data?.message || 
         error?.message || 
         'Failed to toggle like. Please try again.';
       console.error('Detailed error:', error?.response?.data);
       toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreations();
    }
  }, [user]);

  return (
    !isLoading ? (
      <div className="flex-1 h-full flex flex-col gap-4 p-6">
        <h2 className="text-2xl font-semibold text-slate-700">
          Community Creations
        </h2>
        <div className="bg-white h-full w-full rounded-xl overflow-y-scroll p-3">
          <div className="bg-white h-full w-full rounded-xl overflow-y-scroll">
            {(creations || []).map((creation, index) => (
              <div key={index} className="relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/3">
                <img
                  src={creation.content}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <div
                  className="absolute inset-0 flex gap-2 items-end justify-end
                  group-hover:justify-between p-3 group-hover:bg-gradient-to-b 
                  from-transparent to-black/60 text-white rounded-lg transition-all duration-200"
                >
                  <p
                    className="text-sm hidden group-hover:block opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300 flex-1 line-clamp-2"
                  >
                    {creation.prompt}
                  </p>
                  <div className="flex gap-1 items-center">
                    <p className="text-sm">{creation.likes?.length || 0}</p>

                    <Heart
                      onClick={(e) => {
                        e.stopPropagation();
                        imageLikeToggle(creation.id);
                      }}
                      className={`min-w-5 h-5 hover:scale-110 cursor-pointer transition-all duration-200 ${
                        (creation.likes || []).includes(user?.id?.toString() || '')
                          ? "fill-red-500 text-red-600"
                          : "text-white"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex justify-center items-center h-full">
        <span className="h-10 w-10 border-3 rounded-full border-primary border-t-transparent animate-spin"></span>
      </div>
    )
  );
}

export default Community;

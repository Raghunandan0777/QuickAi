import { Scissors, Sparkle } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
  


axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;


function RemoveObject() {
  const [input, setInput] = useState(null);
  const [object, setObject] = useState("");
  const [content, setContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (object.trim().split(" ").length > 1) {
        throw new Error("Please enter only one object name");
      }

      if (!(input instanceof File) || !input.type.startsWith("image/")) {
        throw new Error("Please upload a valid image file.");
      }

      const formData = new FormData();
      formData.append("image", input);
      formData.append("object", object.trim());

      try {
        const { data } = await axios.post(
          "/api/ai/remove-image-object",
          formData,
          { 
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${await getToken()}`
            }
          }
        );

        if (data.success) {
          setContent(data.content);
        } else {
          throw new Error(data.message || "Something went wrong");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response.data.message || "Error occurred");
        } else {
          toast.error(error.message || "Error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(error.message || "Error occurred");
    }
  };

  return (
    <div>
      <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
        {/* Left Column */}
        <form
          onSubmit={onSubmitHandler}
          className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <Sparkle className="w-6 text-[#4A7AFF]" />
            <h1 className="text-xl font-semibold">Object Removal</h1>
          </div>

          <p className="mt-6 text-sm font-medium">Upload image</p>
          <input
            onChange={(e) => setInput(e.target.files[0])}
            type="file"
            className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
            required
            accept="image/*"
          />

          {input && (
            <img
              src={URL.createObjectURL(input)}
              alt="Preview"
              className="mt-4 w-full h-auto rounded-md border"
            />
          )}

          <p className="mt-6 text-sm font-medium">
            Describe object name to remove
          </p>
          <textarea
            onChange={(e) => setObject(e.target.value)}
            value={object}
            rows={4}
            className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
            placeholder="e.g., watch or spoon (only one object name)"
            required
          />

          <button
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <Scissors className="w-5" />
            )}
            Remove object
          </button>
        </form>

        {/* Right Column */}
        <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-[#FF4938]" />
            <h1 className="text-xl font-semibold">Processed Image</h1>
          </div>

          {!content ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400 mt-10">
                <Scissors className="w-9 h-9" />
                <p>Upload an image and click Remove Object to get started</p>
              </div>
            </div>
          ) : (
            <div>
              <img
                src={content}
                alt="Processed"
                className="mt-3 h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RemoveObject;

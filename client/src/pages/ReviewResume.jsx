import { FileText, Sparkle } from "lucide-react";
import React, { useState } from "react";
import Markdown from "react-markdown";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

function ReviewResume() {
  const [input, setInput] = useState("");
  const [content, setContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("resume", input);

      const { data } = await axios.post("/api/ai/review-resume", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkle className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Upload Resume</p>
        <input
          onChange={(e) => setInput(e.target.files[0])}
          type="file"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
          accept=".pdf,application/pdf"
        />
        <p className="text-xs text-gray-500 font-light mt-1">
          Supports PDF Resume Only.
        </p>
        <button
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
        >
          {isLoading ? (
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          ) : (
            <FileText className="w-5" />
          )}
          Review Resume
        </button>
      </form>

      {/* Right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>

        {!content ? (
          <div>
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <FileText className="w-9 h-9" />
                <p>Upload a Resume and click Review Resume to get started</p>
              </div>
            </div>
          </div>
        ) : (
          <div className=" h-full mt-3 overflow-y-scroll text-sm text-slate-600">
            <div className="reset-tw">
              <Markdown>{content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewResume;

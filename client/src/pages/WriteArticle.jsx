import { Edit, Sparkle } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import Markdown from "react-markdown"

function WriteArticle() {

   const articleLength = [
    {length: 800, text: "Short (500-800 words)"},
    {length: 1200, text: "Medium (800-1200 words)"},
    {length: 1600, text: "Short (1200+ words)"},
   ]

   const [selectedLenght, setSelectedLenght] = useState(articleLength[0])
   const [input, setInput] = useState("")
   const [content, setContent] = useState("")
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState("")
   const { getToken } = useAuth()

   const onSubmitHandler = async(e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = await getToken()
      const response = await fetch('http://localhost:3000/api/ai/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: input,
          length: selectedLenght.length
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate article')
      }

      setContent(data.content)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
   }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkle className='w-6 text-[#4A7AFF]'/>
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Article Topic</p>
        <input 
          onChange={(e) => setInput(e.target.value)} 
          value={input} 
          type="text" 
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300' 
          placeholder='The future of artificial Intelligence is....' 
          required 
        />
        <p className='mt-4 text-sm font-medium'>Article Length</p>

        <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {articleLength.map((item,index) => (
            <span 
              onClick={() => setSelectedLenght(item)} 
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer
              ${selectedLenght.text === item.text ? "bg-blue-50 text-blue-700" : "text-gray-500 border-gray-300"} `} 
              key={index}
            >
              {item.text}
            </span>
          ))}
        </div>
        <br />
        <button 
          disabled={isLoading} 
          className={`w-full flex justify-center items-center gap-2 ${
            isLoading 
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#226BFF] to-[#65ADFF] text-white cursor-pointer'
          } px-4 py-2 mt-6 text-sm rounded-lg`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <Edit className='w-5'/>
              Generate article
            </>
          )}
        </button>
      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>
        <div className='flex items-center gap-3'>
          <Edit className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Generated article</h1>
        </div>
        
        {error && (
          <div className='mt-4 p-4 bg-red-50 text-red-700 rounded-lg'>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className='flex-1 flex justify-center items-center mt-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        ) : content ? (
          <div className='flex-1 mt-4 overflow-y-auto text-sm'>
            <div className='reset-tw'>
              <Markdown>
                {content}
              </Markdown>
            </div>
            
          </div>
        ) : (
          <div className='flex-1 flex justify-center items-center'>
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <Edit className='w-9 h-9'/>
              <p>Enter a topic and click Generate article to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WriteArticle

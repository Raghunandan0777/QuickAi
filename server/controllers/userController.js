import sql from "../configs/db.js";



export const getUserCreations = async(req,res) => {
    try {

        const {userId} = req.auth();

        const creations = await sql `SELECT * FROM creations WHERE user_id =
        ${userId} ORDER BY created_at DESC`;

        res.json({success:true, creations})
        
    } catch (error) {
        res.json({success:error, message:error.message})
        
    }
    

}




export const getPublishedCreations = async(req,res) => {
    try {


        const creations = await sql`
  SELECT * FROM creations 
  WHERE publish = true 
  ORDER BY created_at DESC
`;


        res.json({success:true, creations})
        
    } catch (error) {
        res.json({success:error, message:error.message})
        
    }

}


export const toggleLikeCreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    // Validate input
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid creation ID format' 
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Fetch creation with likes as text[]
    const [creation] = await sql`
      SELECT id, likes::text[] as likes 
      FROM creations 
      WHERE id = ${id}
    `;

    if (!creation) {
      return res.status(404).json({ 
        success: false, 
        message: "Creation not found" 
      });
    }

    // Validate likes array
    if (!Array.isArray(creation.likes)) {
      console.error('Invalid likes format in database:', creation.likes);
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid likes format in database' 
      });
    }

    // Safely update likes array
    const userIdStr = userId.toString();
    const updatedLikes = creation.likes.includes(userIdStr)
      ? creation.likes.filter(like => like !== userIdStr)
      : [...creation.likes, userIdStr];

    const message = creation.likes.includes(userIdStr) 
      ? "Creation Unliked" 
      : "Creation Liked";

    try {
      // Use proper PostgreSQL array operations
      await sql`
        UPDATE creations
        SET likes = ${updatedLikes}::text[]
        WHERE id = ${id}
        RETURNING id, likes::text[] as likes
      `;

      // Fetch updated creations list
      const creations = await sql`
        SELECT * FROM creations
        WHERE publish = true
        ORDER BY created_at DESC
      `;

      res.json({ success: true, message, creations });
    } catch (dbError) {
      console.error('Database update error:', {
        error: dbError,
        creationId: id,
        userId: userId,
        updatedLikes: updatedLikes
      });
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update creation likes',
        error: dbError.message,
        details: {
          creationId: id,
          userId: userId,
          action: creation.likes.includes(userIdStr) ? 'unlike' : 'like'
        }
      });
    }
  } catch (error) {
    console.error('Toggle like error:', {
      error: error,
      type: error.name,
      message: error.message
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message,
      details: {
        type: error.name,
        stack: error.stack
      }
    });
  }
};

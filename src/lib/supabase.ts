import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to get all videos from Supabase storage
export async function getVideosFromSupabase() {
  try {
    console.log('Fetching videos from Supabase storage...')
    
    // List all files in the videos bucket
    const { data: files, error } = await supabase.storage
      .from('videos')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error listing files from Supabase:', error)
      throw error
    }

    console.log('Files found in Supabase:', files?.length || 0)

    if (!files || files.length === 0) {
      return []
    }

    // Filter only MP4 files and create video objects
    const videos = files
      .filter(file => file.name.endsWith('.mp4'))
      .map(file => {
        // Get public URL for the video
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(file.name)

        return {
          id: file.name.replace('.mp4', ''),
          title: file.name.replace('.mp4', '').replace(/_/g, ' '),
          description: `Video generated on ${new Date(file.created_at || '').toLocaleDateString()}`,
          video_url: urlData.publicUrl,
          creation_time: file.created_at || new Date().toISOString(),
          category: 'mathematics',
          duration: 'Unknown',
          thumbnail: `${urlData.publicUrl}#t=1`, // Video thumbnail at 1 second
          source: 'supabase'
        }
      })

    console.log('Processed videos:', videos.length)
    return videos

  } catch (error) {
    console.error('Error fetching videos from Supabase:', error)
    throw error
  }
} 
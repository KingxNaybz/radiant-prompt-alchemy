UPDATE public.paintings
SET image_url = 'https://xispoxjjjaevbxstrepr.supabase.co/storage/v1/object/public/paintings/bf4e6766-29b6-494e-b833-d2a4018620b6/velocity-of-dreams-flat-v2.jpg',
    room_mockups = '[]'::jsonb,
    updated_at = now()
WHERE id = '7ae75772-2b73-4e8f-854b-3567ee3d172f';
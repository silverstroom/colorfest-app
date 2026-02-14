-- Allow anonymous/public to read profiles by username for login lookup
CREATE POLICY "Anyone can lookup profiles by username"
ON public.profiles
FOR SELECT
TO anon
USING (true);

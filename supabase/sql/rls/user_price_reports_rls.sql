-- Remove the existing INSERT policy that allows direct inserts
DROP POLICY IF EXISTS "Users can insert their own price reports" ON public.user_price_reports;

-- Create a new INSERT policy that only allows admins to directly insert records
CREATE POLICY "Only admins can directly insert price reports" 
ON public.user_price_reports FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Ensure other policies remain intact
-- First drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own reports" ON public.user_price_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.user_price_reports;
DROP POLICY IF EXISTS "Anyone can view price reports" ON public.user_price_reports;
DROP POLICY IF EXISTS "Allow admins to view all reports" ON public.user_price_reports;
DROP POLICY IF EXISTS "Allow admins to update report status" ON public.user_price_reports;

-- Recreate all policies
-- Users can view their own reports
CREATE POLICY "Users can view their own reports" 
ON public.user_price_reports FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update their own reports" 
ON public.user_price_reports FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Anyone can view price reports
CREATE POLICY "Anyone can view price reports" 
ON public.user_price_reports FOR SELECT 
TO public
USING (true);

-- Allow admins to view all reports
CREATE POLICY "Allow admins to view all reports" 
ON public.user_price_reports FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Allow admins to update report status
CREATE POLICY "Allow admins to update report status" 
ON public.user_price_reports FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

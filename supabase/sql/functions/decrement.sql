-- Generic function to safely decrement a numeric column value in any table
CREATE OR REPLACE FUNCTION public.decrement(row_id uuid, column_name text, table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result INTEGER;
BEGIN
  EXECUTE format('
    UPDATE %I
    SET %I = GREATEST(0, %I - 1)
    WHERE id = $1
    RETURNING %I;
  ', table_name, column_name, column_name, column_name)
  INTO result
  USING row_id;
  
  RETURN result;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.decrement(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement(uuid, text, text) TO service_role;

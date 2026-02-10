
-- Add type column to categories (credit, debit, both)
ALTER TABLE public.categories ADD COLUMN type text NOT NULL DEFAULT 'both';

-- Update existing categories with proper types
UPDATE public.categories SET type = 'debit' WHERE name IN ('किराणा', 'घरभाडे', 'कपडे', 'प्रवास', 'बिल', 'भाजीपाला', 'वैद्यकीय', 'शिक्षण');
UPDATE public.categories SET type = 'credit' WHERE name IN ('पगार', 'व्याज');
UPDATE public.categories SET type = 'both' WHERE name = 'इतर';

-- Add Brahman family specific CREDIT categories
INSERT INTO public.categories (name, type) VALUES
  ('वर्गणी', 'credit'),
  ('देणगी', 'credit'),
  ('पूजा दक्षिणा', 'credit'),
  ('धार्मिक कार्य उत्पन्न', 'credit'),
  ('भाडे उत्पन्न', 'credit'),
  ('सण/उत्सव उत्पन्न', 'credit');

-- Add Brahman family specific DEBIT categories
INSERT INTO public.categories (name, type) VALUES
  ('पूजा साहित्य', 'debit'),
  ('धार्मिक कार्य खर्च', 'debit'),
  ('देवस्थान / मंदिर', 'debit'),
  ('सण/उत्सव खर्च', 'debit'),
  ('दान/दक्षिणा', 'debit'),
  ('गॅस/इंधन', 'debit'),
  ('मोबाइल/इंटरनेट', 'debit'),
  ('घरखर्च', 'debit'),
  ('कर्ज परतफेड', 'debit'),
  ('विमा', 'debit');

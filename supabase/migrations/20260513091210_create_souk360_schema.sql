/*
  # Souk360 – Schema initial

  1. Nouvelles tables
    - `shops` : Commerces listés sur Souk360
      - id, name, category, description, address, phone, whatsapp, rating, review_count
      - is_open, is_verified, user_id (propriétaire), created_at
    - `shop_hours` : Horaires d'ouverture par commerce
      - id, shop_id, day_name, opens_at, closes_at, is_closed
    - `shop_photos` : Photos associées à un commerce
      - id, shop_id, url, is_primary, created_at
    - `reviews` : Avis clients sur les commerces
      - id, shop_id, user_id, author_name, rating, comment, created_at

  2. Sécurité
    - RLS activé sur toutes les tables
    - Lecture publique des commerces vérifiés et de leurs données associées
    - Seuls les propriétaires peuvent modifier leur commerce
    - Les utilisateurs authentifiés peuvent poster des avis
*/

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text DEFAULT '',
  address text DEFAULT '',
  phone text DEFAULT '',
  whatsapp text DEFAULT '',
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_open boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shops"
  ON shops FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert shops"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their shops"
  ON shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their shops"
  ON shops FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Shop hours table
CREATE TABLE IF NOT EXISTS shop_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  day_name text NOT NULL,
  opens_at time,
  closes_at time,
  is_closed boolean DEFAULT false
);

ALTER TABLE shop_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop hours"
  ON shop_hours FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners can manage shop hours"
  ON shop_hours FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can update shop hours"
  ON shop_hours FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can delete shop hours"
  ON shop_hours FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND user_id = auth.uid())
  );

-- Shop photos table
CREATE TABLE IF NOT EXISTS shop_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shop_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop photos"
  ON shop_photos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners can add shop photos"
  ON shop_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can delete shop photos"
  ON shop_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND user_id = auth.uid())
  );

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can write reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update their reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete their reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_is_verified ON shops(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_photos_shop_id ON shop_photos(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_hours_shop_id ON shop_hours(shop_id);

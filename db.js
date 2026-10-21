import pg from "pg";
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) console.warn("DATABASE_URL is not set. Configure it before starting PantryChef.");
export const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
export async function query(text, params = []) { return pool.query(text, params); }
export async function initDb() {
  if (!connectionString) throw new Error("Thiếu DATABASE_URL. Hãy cấu hình URL kết nối PostgreSQL trong môi trường triển khai.");
  await query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'Khác',
      canonical_unit TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (length(trim(name)) > 0), CHECK (length(trim(canonical_unit)) > 0)
    );
    CREATE TABLE IF NOT EXISTS pantry_items (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'local-user',
      ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
      quantity NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
      unit TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Khác',
      expiry_date DATE,
      brand TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK(length(trim(unit)) > 0)
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prep_minutes INTEGER NOT NULL DEFAULT 0 CHECK(prep_minutes >= 0),
      cook_minutes INTEGER NOT NULL DEFAULT 0 CHECK(cook_minutes >= 0),
      servings INTEGER NOT NULL DEFAULT 1 CHECK(servings > 0),
      ingredients_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK(length(trim(title)) > 0)
    );
    CREATE INDEX IF NOT EXISTS idx_pantry_user_expiry ON pantry_items(user_id, expiry_date);
    CREATE INDEX IF NOT EXISTS idx_pantry_ingredient ON pantry_items(ingredient_id);
  `);
  const ingredientCount = Number((await query('SELECT COUNT(*)::int AS n FROM ingredients')).rows[0].n);
  if (!ingredientCount) {
    await query(`INSERT INTO ingredients(name,category,canonical_unit) VALUES
      ('Trứng','Đạm','quả'),('Cà chua','Rau củ','quả'),('Đậu phụ','Đạm','bìa'),('Hành lá','Rau củ','g'),
      ('Dầu ăn','Gia vị','ml'),('Nước mắm','Gia vị','ml'),('Tỏi','Gia vị','tép'),('Gạo','Tinh bột','g') ON CONFLICT(name) DO NOTHING`);
  }
  const recipeCount = Number((await query('SELECT COUNT(*)::int AS n FROM recipes')).rows[0].n);
  if (!recipeCount) {
    const ids = Object.fromEntries((await query('SELECT id,name FROM ingredients')).rows.map(x => [x.name, Number(x.id)]));
    await query(`INSERT INTO recipes(title,description,prep_minutes,cook_minutes,servings,ingredients_json,steps_json) VALUES
      ($1,$2,5,8,2,$3::jsonb,$4::jsonb),($5,$6,8,12,2,$7::jsonb,$8::jsonb)`, [
      'Trứng xào cà chua','Món nhanh, dễ làm cho bữa cơm hằng ngày.', JSON.stringify([
        {ingredient_id:ids['Trứng'],name:'Trứng',quantity:2,unit:'quả',required:true},{ingredient_id:ids['Cà chua'],name:'Cà chua',quantity:2,unit:'quả',required:true},{ingredient_id:ids['Hành lá'],name:'Hành lá',quantity:10,unit:'g',required:false},{ingredient_id:ids['Dầu ăn'],name:'Dầu ăn',quantity:10,unit:'ml',required:true}]), JSON.stringify(['Đánh trứng, rửa và cắt cà chua.','Làm nóng dầu, xào cà chua đến mềm.','Cho trứng vào đảo chín, nêm vừa ăn và thêm hành lá.']),
      'Đậu phụ sốt cà chua','Món ăn thanh nhẹ, hợp dùng với cơm nóng.', JSON.stringify([
        {ingredient_id:ids['Đậu phụ'],name:'Đậu phụ',quantity:2,unit:'bìa',required:true},{ingredient_id:ids['Cà chua'],name:'Cà chua',quantity:2,unit:'quả',required:true},{ingredient_id:ids['Tỏi'],name:'Tỏi',quantity:2,unit:'tép',required:false},{ingredient_id:ids['Dầu ăn'],name:'Dầu ăn',quantity:15,unit:'ml',required:true}]), JSON.stringify(['Cắt đậu phụ thành miếng vừa ăn; bổ múi cà chua.','Chiên áp chảo đậu phụ đến vàng nhẹ.','Phi thơm tỏi, xào cà chua, thêm ít nước rồi cho đậu vào sốt khoảng 5 phút.'])
    ]);
  }
}

import { createClient } from "../../lib/supabase/server";

export default async function TestSupabase() {
  const supabase = await createClient();

  // Test de connexion : récupérer les catégories
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .limit(5);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Test Connexion Supabase</h1>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">❌ Erreur de connexion :</p>
            <p>{error.message}</p>
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-bold">✅ Connexion réussie !</p>
            <p className="mt-2">
              Catégories trouvées : {categories?.length || 0}
            </p>

            {categories && categories.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold">Données récupérées :</p>
                <pre className="mt-2 bg-white p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(categories, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react'
import './App.css'

interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
  tips: string[];
}

function App() {
  const [ingredient, setIngredient] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRecipe(null)

    try {
      const response = await fetch('/api/recipeGeneratorFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ingredient,
            dietaryRestrictions,
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recipe')
      }

      const data = await response.json()
      // Genkit flows often return the actual result in a 'result' property
      const recipeResult = data.result || data;
      setRecipe(recipeResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Genkit Recipe Generator</h1>
      
      <form onSubmit={generateRecipe} className="form">
        <div className="input-group">
          <label htmlFor="ingredient">Ingredient / Theme</label>
          <input
            id="ingredient"
            type="text"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            placeholder="e.g. Avocado, Chicken, Italian"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="restrictions">Dietary Restrictions</label>
          <input
            id="restrictions"
            type="text"
            value={dietaryRestrictions}
            onChange={(e) => setDietaryRestrictions(e.target.value)}
            placeholder="e.g. Vegetarian, Gluten-free, none"
          />
        </div>

        <button type="submit" disabled={loading || !ingredient}>
          {loading ? 'Generating...' : 'Generate Recipe'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {recipe && (
        <div className="recipe-card">
          <h2>{recipe.title}</h2>
          <p className="description">{recipe.description}</p>
          
          <div className="recipe-meta">
            <span><strong>Prep:</strong> {recipe.prepTime}</span>
            <span><strong>Cook:</strong> {recipe.cookTime}</span>
            <span><strong>Servings:</strong> {recipe.servings}</span>
          </div>

          <div className="recipe-section">
            <h3>Ingredients</h3>
            <ul>
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="recipe-section">
            <h3>Instructions</h3>
            <ol>
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="recipe-section">
              <h3>Tips</h3>
              <ul>
                {recipe.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App

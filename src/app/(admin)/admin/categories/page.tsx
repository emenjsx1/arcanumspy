"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAllCategories } from "@/lib/db/categories"
import { supabase } from "@/lib/supabase/client"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  emoji: string | null
  is_premium: boolean
  created_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const { toast } = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const categoriesData = await getAllCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (formData: { name: string; slug: string; description: string; emoji: string; is_premium: boolean }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar categoria')
      }

      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso",
      })
      
      setIsCreateDialogOpen(false)
      await loadCategories()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a categoria",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (id: string, formData: { name: string; slug: string; description: string; emoji: string; is_premium: boolean }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar categoria')
      }

      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso",
      })
      
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a categoria",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (category: Category) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar categoria')
      }

      toast({
        title: "Categoria removida",
        description: "A categoria foi removida com sucesso",
      })
      
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      await loadCategories()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a categoria",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de ofertas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Adicione uma nova categoria de ofertas
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={null}
              onSave={(data) => handleCreate(data)}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            Carregando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            Nenhuma categoria encontrada
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-3xl mb-2">{category.emoji || '📁'}</div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description || 'Sem descrição'}</CardDescription>
                    <div className="mt-2">
                      <Badge variant={category.is_premium ? 'default' : 'secondary'}>
                        {category.is_premium ? 'Premium' : 'Gratuita'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingCategory(category)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCategoryToDelete(category)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Slug: <code className="text-xs">{category.slug}</code>
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Edite os dados da categoria
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSave={(data) => handleUpdate(editingCategory.id, data)}
              onCancel={() => {
                setEditingCategory(null)
                setIsEditDialogOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a categoria &quot;{categoryToDelete?.name}&quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCategoryToDelete(null)
              setIsDeleteDialogOpen(false)
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => categoryToDelete && handleDelete(categoryToDelete)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category: Category | null
  onSave: (data: { name: string; slug: string; description: string; emoji: string; is_premium: boolean }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    emoji: category?.emoji || '',
    is_premium: category?.is_premium || false,
  })
  const { toast } = useToast()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: category ? formData.slug : generateSlug(name),
    })
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Erro de Validação",
        description: "Nome e slug são obrigatórios",
        variant: "destructive",
      })
      return
    }

    onSave({
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      emoji: formData.emoji,
      is_premium: formData.is_premium,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Nome da categoria"
        />
      </div>
      <div className="space-y-2">
        <Label>Slug *</Label>
        <Input
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="slug-da-categoria"
        />
        <p className="text-xs text-muted-foreground">
          URL amigável (ex: slug-da-categoria)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Emoji</Label>
        <Input
          value={formData.emoji}
          onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
          placeholder="📁"
          maxLength={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição da categoria"
          rows={3}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_premium"
          checked={formData.is_premium}
          onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="is_premium" className="cursor-pointer">
          Categoria Premium
        </Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {category ? "Atualizar" : "Criar"} Categoria
        </Button>
      </DialogFooter>
    </div>
  )
}

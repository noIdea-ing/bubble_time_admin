import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
}


interface CategoryWithItems {
  id: string;
  name: string;
  items: MenuItem[];
}

const AdminHome: React.FC = () => {
  const [categoriesWithItems, setCategoriesWithItems] = useState<CategoryWithItems[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Add category state
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState<boolean>(false);

  // Delete category state
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithItems | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState<boolean>(false);

  // Update item state
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [itemToUpdate, setItemToUpdate] = useState<MenuItem | null>(null);
  const [updateItemName, setUpdateItemName] = useState<string>('');
  const [updateItemPrice, setUpdateItemPrice] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    const fetchMenuData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categoriesError) {
          throw categoriesError;
        }

        // Fetch menu items
        const { data: menuItems, error: menuItemsError } = await supabase
          .from('menuItem')
          .select('id, name, price, category_id');

        if (menuItemsError) {
          throw menuItemsError;
        }

        // Group menu items by category and sort items by name
        const categoriesWithItemsData: CategoryWithItems[] = categories.map(category => ({
          id: category.id,
          name: category.name,
          items: menuItems
            .filter(item => item.category_id === category.id)
            .sort((a, b) => a.name.localeCompare(b.name)) // Sort items by name ascending
        }));

        // Debug logging to check the relationships
        console.log('Categories:', categories);
        console.log('Menu Items:', menuItems);
        console.log('Categories with Items:', categoriesWithItemsData);

        // Don't filter out categories with no items - show all categories
        setCategoriesWithItems(categoriesWithItemsData);
        
        // Additional debugging
        console.log('Final categories with items:', categoriesWithItemsData);
        console.log('Total categories found:', categories.length);
        console.log('Total menu items found:', menuItems.length);
        
      } catch (err: any) {
        console.error('Error fetching menu data:', err);
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const refreshMenuData = async () => {
    try {
      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      const { data: menuItems, error: menuItemsError } = await supabase
        .from('menuItem')
        .select('id, name, price, category_id');

      if (!categoriesError && !menuItemsError) {
        const categoriesWithItemsData: CategoryWithItems[] = categories.map(category => ({
          id: category.id,
          name: category.name,
          items: menuItems
            .filter(item => item.category_id === category.id)
            .sort((a, b) => a.name.localeCompare(b.name)) // Sort items by name ascending
        }));

        setCategoriesWithItems(categoriesWithItemsData);
      }
    } catch (err) {
      console.error('Error refreshing menu data:', err);
    }
  };

  const handleAddItem = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setNewItemName('');
    setNewItemPrice('');
    setShowModal(true);
  };

  const handleSubmitNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim() || !newItemPrice.trim()) {
      alert('Please fill in both name and price');
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);

    try {
      const {error } = await supabase
        .from('menuItem')
        .insert([
          {
            name: newItemName.trim(),
            price: price,
            category_id: selectedCategoryId
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Refresh the menu data
      await refreshMenuData();

      // Close modal and reset form
      setShowModal(false);
      setNewItemName('');
      setNewItemPrice('');
      alert('Item added successfully!');

    } catch (err: any) {
      console.error('Error adding item:', err);
      alert(`Error adding item: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleDeleteItem = (item: MenuItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('menuItem')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) {
        throw error;
      }

      // Refresh the menu data
      await refreshMenuData();

      // Close modal and reset
      setShowDeleteModal(false);
      setItemToDelete(null);
      alert('Item deleted successfully!');

    } catch (err: any) {
      console.error('Error deleting item:', err);
      alert(`Error deleting item: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleAddCategory = () => {
    setNewCategoryName('');
    setShowCategoryModal(true);
  };

  const handleSubmitNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    setIsSubmittingCategory(true);

    try {
      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategoryName.trim()
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Refresh the menu data
      await refreshMenuData();

      // Close modal and reset form
      setShowCategoryModal(false);
      setNewCategoryName('');
      alert('Category added successfully!');

    } catch (err: any) {
      console.error('Error adding category:', err);
      alert(`Error adding category: ${err.message}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (category: CategoryWithItems) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);

    try {
      // First, delete all menu items in this category
      if (categoryToDelete.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('menuItem')
          .delete()
          .eq('category_id', categoryToDelete.id);

        if (itemsError) {
          throw itemsError;
        }
      }

      // Then delete the category
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (categoryError) {
        throw categoryError;
      }

      // Refresh the menu data
      await refreshMenuData();

      // Close modal and reset
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      alert('Category deleted successfully!');

    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert(`Error deleting category: ${err.message}`);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleCloseDeleteCategoryModal = () => {
    setShowDeleteCategoryModal(false);
    setCategoryToDelete(null);
  };

  const handleUpdateItem = (item: MenuItem) => {
    setItemToUpdate(item);
    setUpdateItemName(item.name);
    setUpdateItemPrice(item.price.toString());
    setShowUpdateModal(true);
  };

  const handleSubmitUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!updateItemName.trim() || !updateItemPrice.trim()) {
      alert('Please fill in both name and price');
      return;
    }

    const price = parseFloat(updateItemPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (!itemToUpdate) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('menuItem')
        .update({
          name: updateItemName.trim(),
          price: price
        })
        .eq('id', itemToUpdate.id);

      if (error) {
        throw error;
      }

      // Refresh the menu data
      await refreshMenuData();

      // Close modal and reset form
      setShowUpdateModal(false);
      setItemToUpdate(null);
      setUpdateItemName('');
      setUpdateItemPrice('');
      alert('Item updated successfully!');

    } catch (err: any) {
      console.error('Error updating item:', err);
      alert(`Error updating item: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setItemToUpdate(null);
    setUpdateItemName('');
    setUpdateItemPrice('');
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="mb-0">Admin Panel</h1>
          <button 
            className="btn btn-primary"
            onClick={handleAddCategory}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Category
          </button>
        </div>
        
        {loading && (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading menu...</p>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger" role="alert">
            Error loading menu: {error}
          </div>
        )}
        
        {categoriesWithItems.length > 0 && (
          <div>
            {categoriesWithItems.map((category) => (
              <div key={category.id} className="mb-5">
                {/* Category Header */}
                <div className="row mb-3">
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    <h2 className="text-primary border-bottom pb-2 mb-0">
                      {category.name}
                    </h2>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCategory(category)}
                        title="Delete category"
                      >
                        <i className="bi bi-trash3 me-1"></i>
                        Delete Category
                      </button>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleAddItem(category.id, category.name)}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Category Items */}
                {category.items.length > 0 ? (
                  <div className="row g-4">
                    {category.items.map((item) => (
                      <div key={item.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <div className="card h-100 shadow-sm">
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h5 className="card-title mb-0">{item.name}</h5>
                              <div className="d-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleUpdateItem(item)}
                                  title="Update item"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteItem(item)}
                                  title="Delete item"
                                >
                                  <i className="bi bi-trash3"></i>
                                </button>
                              </div>
                            </div>
                            <div className="mt-auto">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="h4 text-primary mb-0">RM{item.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-12">
                      <div className="alert alert-light text-center" role="alert">
                        <i className="bi bi-basket me-2"></i>
                        No items in this category yet. Click "Add Item" to add the first item.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!loading && categoriesWithItems.length === 0 && (
          <div className="text-center">
            <div className="alert alert-info" role="alert">
              <h4 className="alert-heading">No Menu Items</h4>
              <p>No menu items found. Please check back later.</p>
              <small className="text-muted">Check browser console for debug information</small>
            </div>
          </div>
        )}
      </div>

      {/* Bootstrap Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Item to {selectedCategoryName}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                ></button>
              </div>
              <form onSubmit={handleSubmitNewItem}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="itemName" className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="itemName"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Enter item name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="itemPrice" className="form-label">Price (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      id="itemPrice"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder="Enter price"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Item'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                  Confirm Delete
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>?</p>
                <p className="text-muted">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={confirmDeleteItem}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash3 me-1"></i>
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle text-primary me-2"></i>
                  Add New Category
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseCategoryModal}
                  disabled={isSubmittingCategory}
                ></button>
              </div>
              <form onSubmit={handleSubmitNewCategory}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="categoryName" className="form-label">Category Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name (e.g., Appetizers, Main Course, Desserts)"
                      required
                      disabled={isSubmittingCategory}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCloseCategoryModal}
                    disabled={isSubmittingCategory}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmittingCategory}
                  >
                    {isSubmittingCategory ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-1"></i>
                        Add Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && categoryToDelete && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                  Confirm Delete Category
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseDeleteCategoryModal}
                  disabled={isDeletingCategory}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the category <strong>"{categoryToDelete.name}"</strong>?</p>
                {categoryToDelete.items.length > 0 && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> This category contains {categoryToDelete.items.length} item(s). All items in this category will also be deleted.
                  </div>
                )}
                <p className="text-muted">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseDeleteCategoryModal}
                  disabled={isDeletingCategory}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={confirmDeleteCategory}
                  disabled={isDeletingCategory}
                >
                  {isDeletingCategory ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash3 me-1"></i>
                      Yes, Delete Category
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Item Modal */}
      {showUpdateModal && itemToUpdate && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Update Item
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseUpdateModal}
                  disabled={isUpdating}
                ></button>
              </div>
              <form onSubmit={handleSubmitUpdateItem}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="updateItemName" className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="updateItemName"
                      value={updateItemName}
                      onChange={(e) => setUpdateItemName(e.target.value)}
                      placeholder={itemToUpdate.name}
                      required
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="updateItemPrice" className="form-label">Price (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      id="updateItemPrice"
                      value={updateItemPrice}
                      onChange={(e) => setUpdateItemPrice(e.target.value)}
                      placeholder={itemToUpdate.price.toString()}
                      required
                      disabled={isUpdating}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCloseUpdateModal}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Update Item
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;
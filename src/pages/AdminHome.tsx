import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  admin_id?: string; // Added admin_id
  image_url?: string;
}

interface CategoryWithItems {
  id: string;
  name: string;
  admin_id?: string; // Added admin_id
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

  // Add these new state variables for image handling
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [updateItemImage, setUpdateItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [updateImagePreview, setUpdateImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  // Helper function to get admin ID from session storage
  const getAdminId = (): string | null => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      console.error('No user ID found in session storage');
      return null;
    }
    return userId;
  };
  
  const uploadImage = async (file: File, itemName: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${itemName.replace(/\s+/g, '-')}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bubbletimeimage')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError); // Add this
        throw uploadError;
      }

      return filePath;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return '';
  
  const { data } = supabase.storage
    .from('bubbletimeimage')
    .getPublicUrl(imagePath);
   console.log('Generated URL:', data.publicUrl);
  return data.publicUrl;
};

  useEffect(() => {
    const fetchMenuData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, admin_id')
          .order('name');

        if (categoriesError) {
          throw categoriesError;
        }

        // Fetch menu items
        const { data: menuItems, error: menuItemsError } = await supabase
          .from('menuItem')
          .select('id, name, price, category_id, admin_id, image_url');

        if (menuItemsError) {
          throw menuItemsError;
        }

        // Group menu items by category and sort items by name
        const categoriesWithItemsData: CategoryWithItems[] = categories.map(category => ({
          id: category.id,
          name: category.name,
          admin_id: category.admin_id,
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
        .select('id, name, admin_id')
        .order('name');

      const { data: menuItems, error: menuItemsError } = await supabase
        .from('menuItem')
        .select('id, name, price, category_id, admin_id, image_url');

      if (!categoriesError && !menuItemsError) {
        const categoriesWithItemsData: CategoryWithItems[] = categories.map(category => ({
          id: category.id,
          name: category.name,
          admin_id: category.admin_id,
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

    const adminId = getAdminId();
    if (!adminId) {
      alert('Error: Admin ID not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImage(true);

    try {
      let imagePath = null;
      
      // Upload image if provided
      if (newItemImage) {
        imagePath = await uploadImage(newItemImage, newItemName);
        if (!imagePath) {
          alert('Failed to upload image. Item will be created without image.');
        }
      }

      const { error } = await supabase
        .from('menuItem')
        .insert([
          {
            name: newItemName.trim(),
            price: price,
            category_id: selectedCategoryId,
            admin_id: adminId,
            image_url: imagePath
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      await refreshMenuData();
      setShowModal(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemImage(null);
      setImagePreview('');
      alert('Item added successfully!');

    } catch (err: any) {
      console.error('Error adding item:', err);
      alert(`Error adding item: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemImage(null);
    setImagePreview('');
  };

  const handleDeleteItem = (item: MenuItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);

    try {
      // Delete the image from storage if it exists
      if (itemToDelete.image_url) {
        const { error: storageError } = await supabase.storage
          .from('bubbletimeimage')
          .remove([itemToDelete.image_url]);
        
        if (storageError) {
          console.error('Error deleting image from storage:', storageError);
          // Continue with item deletion even if image deletion fails
        }
      }

      // Delete the menu item from database
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

    // Get admin ID from session storage
    const adminId = getAdminId();
    if (!adminId) {
      alert('Error: Admin ID not found. Please log in again.');
      return;
    }

    setIsSubmittingCategory(true);

    try {
      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategoryName.trim(),
            admin_id: adminId // Include admin_id
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
        // Collect all image URLs that need to be deleted
        const imageUrls = categoryToDelete.items
          .filter(item => item.image_url) // Only items with images
          .map(item => item.image_url!); // Extract image URLs

        // Delete images from storage if any exist
        if (imageUrls.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('bubbletimeimage')
            .remove(imageUrls);
          
          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
            // Continue with item deletion even if image deletion fails
          }
        }

        // Then delete all menu items in this category
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
    setUpdateItemImage(null);
    setUpdateImagePreview(item.image_url ? getImageUrl(item.image_url) : '');
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
      let imagePath = itemToUpdate.image_url; // Keep existing image by default
      
      // Upload new image if provided
      if (updateItemImage) {
        const newImagePath = await uploadImage(updateItemImage, updateItemName);
        if (newImagePath) {
          imagePath = newImagePath;
          
          // Delete old image if it exists
          if (itemToUpdate.image_url) {
            await supabase.storage
              .from('bubbletimeimage')
              .remove([itemToUpdate.image_url]);
          }
        }
      }

      const { error } = await supabase
        .from('menuItem')
        .update({
          name: updateItemName.trim(),
          price: price,
          image_url: imagePath
        })
        .eq('id', itemToUpdate.id);

      if (error) {
        throw error;
      }

      await refreshMenuData();
      setShowUpdateModal(false);
      setItemToUpdate(null);
      setUpdateItemName('');
      setUpdateItemPrice('');
      setUpdateItemImage(null);
      setUpdateImagePreview('');
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
    setUpdateItemImage(null);
    setUpdateImagePreview('');
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
                          {/* Image Section */}
                          <div style={{ height: '200px', overflow: 'hidden' }}>
                            {item.image_url ? (
                              <img
                                src={getImageUrl(item.image_url)}
                                alt={item.name}
                                className="card-img-top"
                                style={{ 
                                  height: '100%', 
                                  width: '100%', 
                                  objectFit: 'cover' 
                                }}
                              />
                            ) : (
                              <div 
                                className="d-flex align-items-center justify-content-center bg-light"
                                style={{ height: '100%' }}
                              >
                                <div className="text-center text-muted">
                                  <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
                                  <div className="small">No Image</div>
                                </div>
                              </div>
                            )}
                          </div>
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
                  <div className="mb-3">
                    <label htmlFor="itemImage" className="form-label">Item Image (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      id="itemImage"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewItemImage(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setImagePreview(e.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setImagePreview('');
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'cover' }}
                          className="img-thumbnail"
                        />
                      </div>
                    )}
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
                  <div className="mb-3">
                    <label htmlFor="updateItemImage" className="form-label">Update Image (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      id="updateItemImage"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setUpdateItemImage(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setUpdateImagePreview(e.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={isUpdating}
                    />
                    {updateImagePreview && (
                      <div className="mt-2">
                        <img 
                          src={updateImagePreview} 
                          alt="Preview" 
                          style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'cover' }}
                          className="img-thumbnail"
                        />
                        <div className="small text-muted mt-1">
                          {updateItemImage ? 'New image selected' : 'Current image'}
                        </div>
                      </div>
                    )}
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
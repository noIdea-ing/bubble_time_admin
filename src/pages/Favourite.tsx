import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';

// Define TypeScript interfaces
interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface FavouriteRecord {
  id: string;
  menuitem_id: string;
  user_id: string;
  menuItem: MenuItem;
  userBT: User;
}

interface ProcessedFavouriteData {
  id: string;
  itemName: string;
  price: number;
  imageUrl: string;
  count: number;
  users: string[];
}

const Favourite: React.FC = () => {
  const [favouriteData, setFavouriteData] = useState<ProcessedFavouriteData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavouriteData();
  }, []);

  const fetchFavouriteData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Fetch favourites with related menu items and users
      // Make sure the column names match your database schema
      const { data, error } = await supabase
        .from('favourites')
        .select(`
          id,
          menuItem_id,
          user_id,
          menuItem:menuItem_id (
            id,
            name,
            price,
            image_url
          ),
          userBT:user_id (
            id,
            username,
            email
          )
        `);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data); // Debug log

      if (data) {
        // Ensure the data matches the FavouriteRecord type
        const normalisedData: FavouriteRecord[] = data
          .filter(item => item.menuItem && item.userBT) // Filter out null relationships
          .map((item) => ({
            id: item.id,
            menuitem_id: item.menuItem_id,
            user_id: item.user_id,
            menuItem: Array.isArray(item.menuItem) ? item.menuItem[0] : item.menuItem,
            userBT: Array.isArray(item.userBT) ? item.userBT[0] : item.userBT,
          }));

        console.log('Normalised data:', normalisedData); // Debug log

        // Process data to group by menu item and count favourites
        const processedData = processData(normalisedData);
        console.log('Processed data:', processedData); // Debug log
        setFavouriteData(processedData);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: FavouriteRecord[]): ProcessedFavouriteData[] => {
    // Group by menu item
    const grouped: Record<string, ProcessedFavouriteData> = data.reduce((acc, favourite) => {
      const menuItemId = favourite.menuitem_id;
      const menuItemName = favourite.menuItem?.name || 'Unknown Item';
      const username = favourite.userBT?.username || 'Unknown User';
      const price = favourite.menuItem?.price || 0;
      const imageUrl = favourite.menuItem?.image_url || '';

      if (!acc[menuItemId]) {
        acc[menuItemId] = {
          id: menuItemId,
          itemName: menuItemName,
          price: price,
          imageUrl: imageUrl,
          count: 0,
          users: []
        };
      }

      acc[menuItemId].count += 1;
      // Avoid duplicate usernames for the same item
      if (!acc[menuItemId].users.includes(username)) {
        acc[menuItemId].users.push(username);
      }

      return acc;
    }, {} as Record<string, ProcessedFavouriteData>);

    console.log('Grouped data:', grouped); // Debug log

    // Convert to array and sort by count (most favourited first)
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <div className="text-center">
              <div className="spinner-border text-secondary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Loading favourite data...</h5>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error!</h4>
            <p className="mb-0">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-5">        
        {favouriteData.length === 0 ? (
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <i className="bi bi-heart display-1 text-muted mb-3"></i>
                <h3 className="text-muted">No favourite items found.</h3>
                <p className="text-muted">Start adding some items to your favourites!</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="row mb-5">
              <div className="col-12">
                <h2 className="mb-4 text-dark">Summary Statistics</h2>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-collection display-4 mb-3 text-muted"></i>
                    <h2 className="card-title display-5 fw-bold text-dark">
                      {favouriteData.length}
                    </h2>
                    <p className="card-text text-muted">Total Items Favourited</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-heart-fill display-4 mb-3 text-muted"></i>
                    <h2 className="card-title display-5 fw-bold text-dark">
                      {favouriteData.reduce((sum, item) => sum + item.count, 0)}
                    </h2>
                    <p className="card-text text-muted">Total Favourites</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-trophy-fill display-4 mb-3 text-muted"></i>
                    <h2 className="card-title display-6 fw-bold text-dark" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {favouriteData.length > 0 ? favouriteData[0].itemName : 'N/A'}
                    </h2>
                    <p className="card-text text-muted">Most Popular Item</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Favourite Items Table */}
            <div className="row">
              <div className="col-12">
                <div className="card border">
                  <div className="card-header bg-light">
                    <h5 className="card-title mb-0 text-dark">
                      Favourite Items Overview
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="border-0 text-dark">Item</th>
                            <th scope="col" className="border-0 text-dark">Price (RM)</th>
                            <th scope="col" className="border-0 text-dark">Favourite Count</th>
                            <th scope="col" className="border-0 text-dark">Favourite Users</th>
                          </tr>
                        </thead>
                        <tbody>
                          {favouriteData.map((item) => (
                            <tr key={item.id}>
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  {item.imageUrl && (
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.itemName}
                                      className="rounded me-3"
                                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <h6 className="mb-0 text-dark">{item.itemName}</h6>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0">
                                <span className="fw-bold text-dark">
                                  RM{item.price.toFixed(2)}
                                </span>
                              </td>
                              <td className="border-0">
                                <span className="badge bg-light text-dark border">
                                  {item.count} {item.count === 1 ? 'favourite' : 'favourites'}
                                </span>
                              </td>
                              <td className="border-0">
                                <div className="d-flex flex-wrap gap-1">
                                  {item.users.map((username, userIndex) => (
                                    <span 
                                      key={userIndex}
                                      className="badge bg-light text-dark border"
                                    >
                                      {username}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Favourite;
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

const AdminHome = () => {
     const navigate = useNavigate()
    return (
        <div>
            <Navbar />
            <div className="container mt-4">
                <h1>Welcome to Bubble Time Admin</h1>
                <p>This is the admin home page.</p>
                <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
                    Manage Users
                </button>
            </div>
        </div>
    )
}
export default AdminHome
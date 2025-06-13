import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Container, Nav } from 'react-bootstrap'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  const isLoggedIn = !!sessionStorage.getItem('userId')

  return (
    <BootstrapNavbar bg="light" expand="lg" className="mb-3">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/adminHome">
          Bubble Time Admin
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/adminHome"
              active={location.pathname === '/adminHome'}
            >
              Home
            </Nav.Link>
            {isLoggedIn && (
              <Nav.Link onClick={handleLogout}>
                Logout
              </Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar
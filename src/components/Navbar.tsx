import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Container, Nav, Modal, Button } from 'react-bootstrap'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('user')
    setShowLogoutModal(false)
    navigate('/login')
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleCloseModal = () => {
    setShowLogoutModal(false)
  }

  const isLoggedIn = !!sessionStorage.getItem('userId')

  return (
    <>
      <BootstrapNavbar bg="light" expand="lg" className="mb-3">
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/adminHome">
            <img
              src="icon.png"
              alt="Logo"
              style={{ height: '35px', marginRight: '10px' }}
            />
            My Bubble Time
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
                <Nav.Link 
                  as={Link} 
                  to="/Favourite"
                  active={location.pathname === '/Favourite'}
                >
                  Analysis
                </Nav.Link>
              )}
              {isLoggedIn && (
                <Nav.Link onClick={handleLogoutClick}>
                  Logout
                </Nav.Link>
              )}
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to log out?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Navbar
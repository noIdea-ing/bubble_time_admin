import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Container, Nav } from 'react-bootstrap'

const Navbar = () => {
  const location = useLocation()

  return (
    <BootstrapNavbar bg="light" expand="lg" className="mb-3">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Bubble Time Admin
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={location.pathname === '/adminHome'}
            >
              Home
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar
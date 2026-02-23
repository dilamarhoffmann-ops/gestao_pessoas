import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DiscountsPage = lazy(() => import('./pages/DiscountsPage'));
const LawsuitsPage = lazy(() => import('./pages/LawsuitsPage'));
const HiringPage = lazy(() => import('./pages/HiringPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/lawsuits" element={<LawsuitsPage />} />
            <Route path="/hiring" element={<HiringPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

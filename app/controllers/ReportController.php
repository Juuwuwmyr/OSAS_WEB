<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ReportModel.php';

class ReportController extends Controller {
    private $model;

    public function __construct() {
        header('Content-Type: application/json');
        @session_start();
        $this->model = new ReportModel();
    }

    public function index() {
        try {
            // Check if user wants to generate/refresh reports
            $generate = $this->getGet('generate', false);
            if ($generate === 'true' || $generate === '1') {
                $startDate = $this->getGet('startDate', null);
                $endDate = $this->getGet('endDate', null);
                
                $result = $this->model->generateReportsFromViolations($startDate, $endDate);
                
                $response = [
                    'status' => 'success',
                    'message' => "Reports generated successfully. Generated: {$result['generated']}, Updated: {$result['updated']}",
                    'generated' => $result['generated'],
                    'updated' => $result['updated'],
                    'total' => $result['total']
                ];
                
                $this->json($response);
                return;
            }
            
            // Get filters from query parameters
            $filters = [
                'department' => $this->getGet('department', 'all'),
                'section' => $this->getGet('section', 'all'),
                'status' => $this->getGet('status', 'all'),
                'startDate' => $this->getGet('startDate', null),
                'endDate' => $this->getGet('endDate', null),
                'search' => $this->getGet('search', ''),
                'timePeriod' => $this->getGet('timePeriod', null)
            ];
            
            // Handle time period filters
            if ($filters['timePeriod'] && !$filters['startDate'] && !$filters['endDate']) {
                $dateRange = $this->getDateRange($filters['timePeriod']);
                if ($dateRange) {
                    $filters['startDate'] = $dateRange['start'];
                    $filters['endDate'] = $dateRange['end'];
                }
            }
            
            // Get reports
            $reports = $this->model->getStudentReports($filters);
            
            // Get statistics
            $stats = $this->model->getReportStats($filters);
            
            error_log("ReportController: Retrieved " . count($reports) . " reports");
            error_log("ReportController: Stats: " . print_r($stats, true));
            
            $response = [
                'status' => 'success',
                'message' => count($reports) > 0 ? 'Reports retrieved successfully' : 'No reports found. Click "Generate Report" to create reports from violations.',
                'reports' => $reports,
                'data' => $reports,
                'stats' => $stats,
                'count' => count($reports),
                'filters_applied' => $filters
            ];
            
            $this->json($response);
        } catch (Exception $e) {
            error_log("ReportController Error: " . $e->getMessage());
            $this->error('Failed to retrieve reports: ' . $e->getMessage());
        }
    }
    
    /**
     * Get date range based on time period
     */
    private function getDateRange($timePeriod) {
        $today = new DateTime();
        
        switch ($timePeriod) {
            case 'today':
                return [
                    'start' => $today->format('Y-m-d'),
                    'end' => $today->format('Y-m-d')
                ];
            case 'this_week':
                $start = clone $today;
                $start->modify('monday this week');
                return [
                    'start' => $start->format('Y-m-d'),
                    'end' => $today->format('Y-m-d')
                ];
            case 'this_month':
                $start = clone $today;
                $start->modify('first day of this month');
                return [
                    'start' => $start->format('Y-m-d'),
                    'end' => $today->format('Y-m-d')
                ];
            case 'this_year':
                $start = clone $today;
                $start->modify('first day of January this year');
                return [
                    'start' => $start->format('Y-m-d'),
                    'end' => $today->format('Y-m-d')
                ];
            case 'last_7_days':
                $start = clone $today;
                $start->modify('-7 days');
                return [
                    'start' => $start->format('Y-m-d'),
                    'end' => $today->format('Y-m-d')
                ];
            case 'last_30_days':
                $start = clone $today;
                $start->modify('-30 days');
                return [
                    'start' => $start->format('Y-m-d'),
                    'end' => $today->format('Y-m-d')
                ];
            default:
                return null;
        }
    }
}


<?php
require_once __DIR__ . '/../core/Model.php';

class AnnouncementModel extends Model {
    protected $table = 'announcements';
    protected $primaryKey = 'id';

    /**
     * Get all announcements with filters
     */
    public function getFiltered($filter = 'all', $search = '') {
        // Check if table exists
        $tableCheck = @$this->conn->query("SHOW TABLES LIKE '{$this->table}'");
        if ($tableCheck === false || $tableCheck->num_rows === 0) {
            // Table doesn't exist, return empty array
            return [];
        }

        $query = "SELECT * FROM {$this->table} WHERE deleted_at IS NULL";
        $params = [];
        $types = "";

        // Filter by status
        if ($filter === 'active') {
            $query .= " AND status = 'active'";
        } elseif ($filter === 'archived') {
            $query .= " AND status = 'archived'";
        }

        // Search functionality
        if (!empty($search)) {
            $query .= " AND (title LIKE ? OR message LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= "ss";
        }

        $query .= " ORDER BY created_at DESC";

        try {
            if (!empty($params)) {
                $stmt = $this->conn->prepare($query);
                if ($stmt) {
                    $stmt->bind_param($types, ...$params);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $data = [];
                    while ($row = $result->fetch_assoc()) {
                        $data[] = $row;
                    }
                    $stmt->close();
                    return $data;
                } else {
                    error_log("AnnouncementModel::getFiltered - Failed to prepare statement: " . $this->conn->error);
                    return [];
                }
            } else {
                $result = $this->conn->query($query);
                if ($result === false) {
                    error_log("AnnouncementModel::getFiltered - Query failed: " . $this->conn->error);
                    return [];
                }
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
                return $data;
            }
        } catch (Throwable $e) {
            error_log("AnnouncementModel::getFiltered error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return [];
        }

        return [];
    }

    /**
     * Get active announcements (for display)
     */
    public function getActive($limit = null) {
        // Check if table exists
        $tableCheck = @$this->conn->query("SHOW TABLES LIKE '{$this->table}'");
        if ($tableCheck === false || $tableCheck->num_rows === 0) {
            // Table doesn't exist, return empty array
            return [];
        }

        $query = "SELECT * FROM {$this->table} 
                  WHERE status = 'active' AND deleted_at IS NULL 
                  ORDER BY 
                    CASE type 
                        WHEN 'urgent' THEN 1 
                        WHEN 'warning' THEN 2 
                        ELSE 3 
                    END,
                    created_at DESC";
        
        if ($limit) {
            $query .= " LIMIT " . intval($limit);
        }

        try {
            $result = $this->conn->query($query);
            $data = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
            }
            return $data;
        } catch (Exception $e) {
            error_log("AnnouncementModel::getActive error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Archive announcement
     */
    public function archive($id) {
        $query = "UPDATE {$this->table} SET status = 'archived', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL";
        $stmt = $this->conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("i", $id);
            $result = $stmt->execute();
            $stmt->close();
            return $result;
        }
        return false;
    }

    /**
     * Restore archived announcement
     */
    public function restore($id) {
        $query = "UPDATE {$this->table} SET status = 'active', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL";
        $stmt = $this->conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("i", $id);
            $result = $stmt->execute();
            $stmt->close();
            return $result;
        }
        return false;
    }

    /**
     * Soft delete announcement
     */
    public function softDelete($id) {
        $query = "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("i", $id);
            $result = $stmt->execute();
            $stmt->close();
            return $result;
        }
        return false;
    }
}


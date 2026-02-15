<?php
$conn = new mysqli('localhost', 'root', '', 'osas');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "ALTER TABLE violations ADD COLUMN is_archived TINYINT(1) DEFAULT 0";
if ($conn->query($sql) === TRUE) {
    echo "Column is_archived added successfully\n";
} else {
    echo "Error adding column: " . $conn->error . "\n";
}

$sql = "CREATE INDEX idx_is_archived ON violations(is_archived)";
if ($conn->query($sql) === TRUE) {
    echo "Index idx_is_archived created successfully\n";
} else {
    echo "Error creating index: " . $conn->error . "\n";
}

$conn->close();
?>

export default function LinkCardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface-container-lowest)",
        border: "1px solid var(--border-color)",
        borderRadius: "4px",
        padding: "16px 20px",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <div
          className="skeleton"
          style={{
            width: "48px",
            height: "14px",
          }}
        />
      </div>

      <div
        className="skeleton"
        style={{
          height: "16px",
          marginBottom: "8px",
          width: "90%",
        }}
      />
      <div
        className="skeleton"
        style={{
          height: "16px",
          marginBottom: "12px",
          width: "70%",
        }}
      />

      <div
        className="skeleton"
        style={{
          height: "10px",
          marginBottom: "12px",
          width: "100%",
        }}
      />

      <div
        className="skeleton"
        style={{
          height: "10px",
          width: "50%",
        }}
      />
    </div>
  );
}

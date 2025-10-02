const Logo = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 48 }}>
      <img
        src={process.env.PUBLIC_URL + '/logo.png'}
        alt="Logo"
        style={{ height: 72, width: 'auto', marginRight: 12, verticalAlign: 'middle' }}
      />
    </div>
  );
};
export default Logo;

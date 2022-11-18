import '../attributes'

PostgresLoader:
  name='PostgresLoader' '{'
    host=HostAttribute &
    port=PortAttribute &
    username=UsernameAttribute &
    password=PasswordAttribute &
    database=DatabaseAttribute &
    table=TableAttribute
  '}';

HostAttribute returns StringAttribute:
  'host' StringAttributeFragment;

PortAttribute returns IntAttribute:
  'port' IntAttributeFragment;

UsernameAttribute returns StringAttribute:
  'username' StringAttributeFragment;

PasswordAttribute returns StringAttribute:
  'password' StringAttributeFragment;

DatabaseAttribute returns StringAttribute:
  'database' StringAttributeFragment;

TableAttribute returns StringAttribute:
  'table' StringAttributeFragment;

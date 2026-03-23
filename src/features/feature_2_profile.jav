package Create;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import Retrieve.GetUserHandler;
import Update.UpdateUserHandler;
import CreditCard.CreateCreditCardHandler;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;


class User {
    private String username;
    private String password;
    private String name;
    private String email;
    private String homeAddress;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHomeAddress() { return homeAddress; }
    public void setHomeAddress(String homeAddress) { this.homeAddress = homeAddress; }
}

class UserDAO {

    public void createUser(User user) throws Exception {
        String sql = "INSERT INTO users (username, password, name, email, home_address) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getPassword());
            stmt.setString(3, user.getName());
            stmt.setString(4, user.getEmail());
            stmt.setString(5, user.getHomeAddress());

            stmt.executeUpdate();
        }
    }

    public User getUserByUsername(String username) throws Exception {
        String sql = "SELECT * FROM users WHERE username = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                User u = new User();
                u.setUsername(rs.getString("username"));
                u.setPassword(rs.getString("password"));
                u.setName(rs.getString("name"));
                u.setEmail(rs.getString("email"));
                u.setHomeAddress(rs.getString("home_address"));
                return u;
            }
            return null;
        }
    }
}


class Database {
    private static final String URL = "jdbc:mysql://localhost:3306/profile"; // Temp
    private static final String USER = "root";
    private static final String PASS = "Broopy!12";

    public static Connection getConnection() throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        return DriverManager.getConnection(URL, USER, PASS);
    }
}

class JsonParser {

    public static User parseUser(String json) {
        User u = new User();

        u.setUsername(extract(json, "username"));
        u.setPassword(extract(json, "password"));
        u.setName(extract(json, "name"));
        u.setEmail(extract(json, "email"));
        u.setHomeAddress(extract(json, "homeAddress"));

        return u;
    }

    public static String extract(String json, String field) {
        try {
            String key = "\"" + field + "\"";
            int start = json.indexOf(key);
            if (start == -1) return null;

            int colon = json.indexOf(":", start);
            int quote1 = json.indexOf("\"", colon + 1);
            int quote2 = json.indexOf("\"", quote1 + 1);

            return json.substring(quote1 + 1, quote2);
        } catch (Exception e) {
            return null;
        }
    }
}


class Utils {

    public static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
}


class CreateUserHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        Utils.addCorsHeaders(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try {
            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                sendJson(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            InputStream is = exchange.getRequestBody();
            String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            User user = JsonParser.parseUser(json);

            if (user.getUsername() == null || user.getUsername().isBlank()) {
                sendJson(exchange, 400, "{\"error\":\"Username is required\"}");
                return;
            }

            if (user.getPassword() == null || user.getPassword().isBlank()) {
                sendJson(exchange, 400, "{\"error\":\"Password is required\"}");
                return;
            }

            new UserDAO().createUser(user);

            String response = "{\"status\":\"success\",\"message\":\"User created\"}";
            sendJson(exchange, 201, response);

        } catch (Exception e) {
            e.printStackTrace();
            sendJson(exchange, 500, "{\"error\":\"Internal server error\"}");
        }
    }

    private void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }
}


public class Main {
    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0); // Temp

        server.createContext("/users", new CreateUserHandler());
        server.createContext("/users/get/", new GetUserHandler());
        server.createContext("/users/update/", new UpdateUserHandler());
        server.createContext("/cards/create/", new CreateCreditCardHandler());

        server.start();
        System.out.println("Server running on port 8080");
    }
}

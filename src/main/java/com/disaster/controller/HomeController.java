package com.disaster.controller;

import com.disaster.domain.MemberDTO;
import com.disaster.service.indexService;

import lombok.RequiredArgsConstructor;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final indexService indexService;

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/api/me/location")
    @ResponseBody
    public Map<String, Object> meLocation(Principal principal) {
        Map<String, Object> res = new HashMap<>();
        res.put("loggedIn", false);
        res.put("lat", 35.681236);
        res.put("lon", 139.767125);

        if (principal != null) {
            MemberDTO addr = indexService.getPrimaryAddress(principal.getName());
            if (addr != null) {
                res.put("loggedIn", true);
                res.put("email", addr.getEmail());
                res.put("lat", addr.getLat());
                res.put("lon", addr.getLon());
            }
        }
        return res;
    }
}
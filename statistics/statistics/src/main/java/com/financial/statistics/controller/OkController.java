package com.financial.statistics.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OkController {

    @GetMapping
    public String ok() {
        return "ok";
    }
}

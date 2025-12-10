package com.financial.statistics.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.financial.statistics.dto.PersonDto;
import com.financial.statistics.entity.Person;
import com.financial.statistics.service.PersonService;

@RestController
@RequestMapping("/person")
public class PersonController {

    @Autowired
    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @PostMapping("/save")
    public ResponseEntity<?> savePerson(@RequestBody PersonDto person) {
        personService.savePerson(person);
        return ResponseEntity.ok(person);
    }

    @GetMapping("/list")
    public ResponseEntity<List<Person>> getAllPersons() {
        List<Person> persons = personService.getAllPersons();
        return ResponseEntity.ok(persons);
    }

    @GetMapping("/id")
    public ResponseEntity<Person> getPersonById(@RequestParam Long id) {
        Person person = personService.getPersonById(id);
        return ResponseEntity.ok(person);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updatePersonById(@PathVariable Long id, @RequestBody PersonDto person) {
        personService.updatePersonById(id, person);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deletePersonById(@PathVariable Long id) {
        personService.deletePersonById(id);
        return ResponseEntity.ok().build();
    }
}

package com.financial.statistics.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.financial.statistics.dto.PersonDto;
import com.financial.statistics.entity.Person;
import com.financial.statistics.exception.PersonAlreadyExistsException;
import com.financial.statistics.repository.PersonRepository;

@Service
public class PersonService {
    @Autowired
    private final PersonRepository personRepository;

    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    public void savePerson(PersonDto personDto) {
        Person person = setPerson(personDto);
        personRepository.save(person);
    }

    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    /**
     * Ez egy olyan végpont ami ID alapján visszaad egy db persont az adatbázisból.
     * 
     * @param id
     *            person azonosítója
     * @return person entityvel
     */
    public Person getPersonById(Long id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new PersonAlreadyExistsException("Nincs ilyen person azonosító."));
    }

    public void updatePersonById(Long id, PersonDto personDto) {
        Person currentPerson = getPersonById(id);

        currentPerson.setFirstName(personDto.getFirstName());
        currentPerson.setLastName(personDto.getLastName());
        currentPerson.setAge(personDto.getAge());
        personRepository.save(currentPerson);
    }

    private Person setPerson(PersonDto personDto) {
        Person person = new Person();
        person.setFirstName(personDto.getFirstName());
        person.setLastName(personDto.getLastName());
        person.setAge(personDto.getAge());

        return person;
    }

    public void deletePersonById(Long id) {
        personRepository.deleteById(id);
    }
}
